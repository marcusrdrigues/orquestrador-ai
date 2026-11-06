import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FalhaApi, OrquestracaoResponse } from '../types/orquestrador'
import { ErroApi, TIMEOUT_MS, executar } from './orquestradorApi'

const pedido = { usuario: 'Sergio Mendes', pergunta: 'Como solicito férias?' }

const sucesso: OrquestracaoResponse = {
  idExecucao: '11111111-1111-1111-1111-111111111111',
  traceId: 'abc123',
  agenteExecutado: 'Agente RH AI',
  protocolo: 'A2A',
  destino: 'RH',
  resposta: 'Texto retornado',
  tokensEntradaOrquestrador: 450,
  tokensCacheOrquestrador: 0,
  tokensSaidaOrquestrador: 60,
  custoOrquestradorUsd: 0.000276,
  duracaoMs: 1400,
}

function resposta(status: number, corpo: string) {
  return new Response(corpo, { status })
}

async function falhaDe(promessa: Promise<unknown>): Promise<FalhaApi> {
  try {
    await promessa
  } catch (erro) {
    if (erro instanceof ErroApi) return erro.falha
    throw erro
  }
  throw new Error('Era esperada uma falha')
}

describe('executar', () => {
  const fetchSimulado = vi.fn()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('envia POST para o caminho relativo /api com usuario e pergunta', async () => {
    fetchSimulado.mockResolvedValue(resposta(200, JSON.stringify(sucesso)))

    const resultado = await executar(pedido)

    expect(resultado).toEqual(sucesso)
    expect(fetchSimulado).toHaveBeenCalledTimes(1)
    const [url, opcoes] = fetchSimulado.mock.calls[0]
    expect(url).toBe('/api/orquestrador/executar')
    expect(opcoes.method).toBe('POST')
    expect(opcoes.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(opcoes.body)).toEqual(pedido)
  })

  it('aceita custo recebido em notação científica', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(
        200,
        JSON.stringify(sucesso).replace('0.000276', '2.76E-4'),
      ),
    )

    const resultado = await executar(pedido)

    expect(resultado.custoOrquestradorUsd).toBe(0.000276)
  })

  it('HTTP 400 vira validacao e não expõe o corpo', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(400, '{"detail":"Segredo interno do framework"}'),
    )

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('validacao')
    expect(falha.mensagem).not.toContain('Segredo')
  })

  it('HTTP 502 com ProblemDetail vira execucao e extrai os identificadores', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(
        502,
        JSON.stringify({
          title: 'Falha no orquestrador',
          status: 502,
          detail:
            'Não foi possível concluir a execução. idExecucao=22222222-2222-2222-2222-222222222222; traceId=trace999',
        }),
      ),
    )

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('execucao')
    expect(falha.mensagem).toBe('Não foi possível concluir a execução.')
    expect(falha.idExecucao).toBe('22222222-2222-2222-2222-222222222222')
    expect(falha.traceId).toBe('trace999')
  })

  it('HTTP 503 com detail sem identificadores vira execucao sem eles', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(503, '{"detail":"Banco indisponível."}'),
    )

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('execucao')
    expect(falha.mensagem).toBe('Banco indisponível.')
    expect(falha.idExecucao).toBeUndefined()
    expect(falha.traceId).toBeUndefined()
  })

  it('limita o detail a 300 caracteres', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(502, JSON.stringify({ detail: 'x'.repeat(1000) })),
    )

    const falha = await falhaDe(executar(pedido))

    expect(falha.mensagem).toHaveLength(300)
  })

  it('HTTP 5xx sem corpo vira indisponivel', async () => {
    fetchSimulado.mockResolvedValue(resposta(500, ''))

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('indisponivel')
    expect(falha.mensagem).toContain('HTTP 500')
  })

  it('HTTP 5xx com corpo que não é JSON vira indisponivel', async () => {
    fetchSimulado.mockResolvedValue(resposta(502, '<html>Bad Gateway</html>'))

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('indisponivel')
    expect(falha.mensagem).not.toContain('html')
  })

  it('outro status (404) vira indisponivel com o status na mensagem', async () => {
    fetchSimulado.mockResolvedValue(resposta(404, ''))

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('indisponivel')
    expect(falha.mensagem).toContain('HTTP 404')
  })

  it('erro de rede vira indisponivel', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('indisponivel')
  })

  it('HTTP 200 fora da forma esperada vira execucao', async () => {
    fetchSimulado.mockResolvedValue(
      resposta(200, JSON.stringify({ ...sucesso, duracaoMs: 'rápido' })),
    )

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('execucao')
    expect(falha.mensagem).toContain('formato inesperado')
  })

  it('HTTP 200 sem JSON vira execucao', async () => {
    fetchSimulado.mockResolvedValue(resposta(200, 'ok'))

    const falha = await falhaDe(executar(pedido))

    expect(falha.categoria).toBe('execucao')
  })

  it('estoura o tempo limite de 180 s e vira timeout', async () => {
    vi.useFakeTimers()
    fetchSimulado.mockImplementation(
      (_url: string, opcoes: RequestInit) =>
        new Promise((_resolve, rejeitar) => {
          opcoes.signal?.addEventListener('abort', () =>
            rejeitar(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const promessa = falhaDe(executar(pedido))
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1)
    expect(fetchSimulado.mock.calls[0][1].signal.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)

    const falha = await promessa

    expect(TIMEOUT_MS).toBe(180_000)
    expect(falha.categoria).toBe('timeout')
  })

  it('não repete a chamada depois de uma falha, nem com o tempo passando', async () => {
    vi.useFakeTimers()
    fetchSimulado.mockResolvedValue(resposta(502, ''))

    await falhaDe(executar(pedido))
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS * 2)

    expect(fetchSimulado).toHaveBeenCalledTimes(1)
  })
})
