import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ErroApi, executar } from './services/orquestradorApi'
import { respostaDireta, respostaRh } from './testes/fixtures'
import type { OrquestracaoResponse } from './types/orquestrador'

// O serviço é substituído só nos testes de tela; a validação ponta a ponta usa a API real.
vi.mock('./services/orquestradorApi', async (importarOriginal) => {
  const original =
    await importarOriginal<typeof import('./services/orquestradorApi')>()
  return { ...original, executar: vi.fn() }
})

const executarSimulado = vi.mocked(executar)

async function preencher(
  user: ReturnType<typeof userEvent.setup>,
  nome = 'Sergio',
  pergunta = 'Como solicito férias?',
) {
  await user.type(screen.getByLabelText('Nome do usuário'), nome)
  await user.type(screen.getByLabelText('Pergunta'), pergunta)
}

function campoPergunta() {
  return screen.getByLabelText('Pergunta') as HTMLTextAreaElement
}

function campoNome() {
  return screen.getByLabelText('Nome do usuário') as HTMLInputElement
}

describe('App', () => {
  beforeEach(() => {
    executarSimulado.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('US1 - perguntar e receber a resposta', () => {
    it('envia, mostra a resposta e o agente, limpa a pergunta e mantém o nome', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(await screen.findByText('Texto retornado')).toBeTruthy()
      expect(screen.getByText('Agente RH AI')).toBeTruthy()
      expect(executarSimulado).toHaveBeenCalledWith({
        usuario: 'Sergio',
        pergunta: 'Como solicito férias?',
      })
      expect(campoPergunta().value).toBe('')
      expect(campoNome().value).toBe('Sergio')
    })

    it('identifica o Orquestrador AI quando ele responde direto', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue(respostaDireta)
      render(<App />)

      await preencher(user, 'Ana', 'Explique o que é uma API REST.')
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(
        await screen.findByText('Orquestrador AI', { selector: '.selo' }),
      ).toBeTruthy()
    })

    it('mostra "Enviando…" e faz uma única chamada com cliques e Enter repetidos', async () => {
      const user = userEvent.setup()
      let resolver!: (resposta: OrquestracaoResponse) => void
      executarSimulado.mockReturnValue(
        new Promise<OrquestracaoResponse>((resolve) => {
          resolver = resolve
        }),
      )
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      const botao = screen.getByRole('button', { name: /Enviando/ })
      expect((botao as HTMLButtonElement).disabled).toBe(true)

      await user.click(botao)
      await user.dblClick(botao)
      await user.type(campoNome(), '{Enter}')

      expect(executarSimulado).toHaveBeenCalledTimes(1)

      resolver(respostaRh)
      expect(await screen.findByText('Texto retornado')).toBeTruthy()
      expect(executarSimulado).toHaveBeenCalledTimes(1)
    })

    it('não chama o serviço com campos inválidos e mostra os erros', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(screen.getByText('Informe o nome.')).toBeTruthy()
      expect(screen.getByText('Informe a pergunta.')).toBeTruthy()
      expect(executarSimulado).not.toHaveBeenCalled()
    })

    it('recusa nome com 121 caracteres e pergunta com 4001', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(campoNome())
      await user.paste('a'.repeat(121))
      await user.click(campoPergunta())
      await user.paste('p'.repeat(4001))
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(screen.getByText('O nome aceita até 120 caracteres.')).toBeTruthy()
      expect(
        screen.getByText('A pergunta aceita até 4000 caracteres.'),
      ).toBeTruthy()
      expect(executarSimulado).not.toHaveBeenCalled()
    })

    it('exibe marcação HTML da resposta como texto, sem interpretá-la', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue({
        ...respostaDireta,
        resposta: '<script>alert(1)</script><b>negrito</b>',
      })
      const { container } = render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(
        await screen.findByText('<script>alert(1)</script><b>negrito</b>'),
      ).toBeTruthy()
      expect(container.querySelector('script')).toBeNull()
      expect(container.querySelector('b')).toBeNull()
    })

    it('mostra resposta em JSON dentro de um bloco expansível', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue({
        ...respostaDireta,
        resposta: '{"dias":30}',
      })
      const { container } = render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(await screen.findByText('Resposta em JSON (expandir)')).toBeTruthy()
      const detalhes = container.querySelector('details')
      expect(detalhes).not.toBeNull()
      expect(detalhes?.open).toBe(false)
      expect(container.querySelector('pre')?.textContent).toBe(
        '{\n  "dias": 30\n}',
      )
    })
  })

  describe('US3 - falhas', () => {
    it('mostra a falha, mantém a pergunta, mostra custo desconhecido e não reenvia', async () => {
      const user = userEvent.setup()
      executarSimulado.mockRejectedValue(
        new ErroApi({
          categoria: 'indisponivel',
          mensagem:
            'Não foi possível falar com a API. Confira se o backend está no ar.',
        }),
      )
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      const alerta = await screen.findByRole('alert')
      expect(alerta.textContent).toContain('API indisponível')
      expect(alerta.textContent).toContain('Custo desconhecido')
      expect(campoPergunta().value).toBe('Como solicito férias?')
      expect(
        (screen.getByRole('button', { name: 'Enviar pergunta' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false)

      await new Promise((resolver) => setTimeout(resolver, 100))
      expect(executarSimulado).toHaveBeenCalledTimes(1)
    })

    it('só chama de novo quando a pessoa envia outra vez', async () => {
      const user = userEvent.setup()
      executarSimulado
        .mockRejectedValueOnce(
          new ErroApi({ categoria: 'timeout', mensagem: 'Sem resposta.' }),
        )
        .mockResolvedValueOnce(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByRole('alert')

      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(await screen.findByText('Texto retornado')).toBeTruthy()
      expect(executarSimulado).toHaveBeenCalledTimes(2)
    })

    it('trata erro inesperado do serviço como falha na execução', async () => {
      const user = userEvent.setup()
      executarSimulado.mockRejectedValue(new Error('detalhe interno'))
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      const alerta = await screen.findByRole('alert')
      expect(alerta.textContent).toContain('Falha na execução')
      expect(alerta.textContent).not.toContain('detalhe interno')
    })
  })

  describe('US4 - exemplos', () => {
    it('mostra os três exemplos com o histórico vazio', () => {
      render(<App />)

      expect(screen.getByText('Olá! O que você pode fazer?')).toBeTruthy()
      expect(screen.getByText('Explique o que é uma API REST.')).toBeTruthy()
      expect(screen.getByText('Como solicito férias?')).toBeTruthy()
    })

    it('preenche o campo ao escolher um exemplo, sem enviar', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(
        screen.getByRole('button', { name: 'Explique o que é uma API REST.' }),
      )

      expect(campoPergunta().value).toBe('Explique o que é uma API REST.')
      expect(executarSimulado).not.toHaveBeenCalled()
    })

    it('some quando já existe uma entrada no histórico', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Texto retornado')

      expect(screen.queryByText('Comece por um exemplo')).toBeNull()
    })
  })

  describe('US5 - histórico e limpeza', () => {
    it('mantém as entradas anteriores em ordem cronológica e mostra o aviso', async () => {
      const user = userEvent.setup()
      executarSimulado
        .mockResolvedValueOnce({ ...respostaDireta, resposta: 'Primeira resposta' })
        .mockResolvedValueOnce({ ...respostaRh, resposta: 'Segunda resposta' })
      render(<App />)

      await preencher(user, 'Ana', 'Primeira pergunta')
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Primeira resposta')

      await user.type(campoPergunta(), 'Segunda pergunta')
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Segunda resposta')

      const itens = screen.getAllByRole('listitem')
      expect(itens[0].textContent).toContain('Primeira resposta')
      expect(itens[1].textContent).toContain('Segunda resposta')
      expect(
        screen.getByText(/o agente não lembra das anteriores/),
      ).toBeTruthy()
    })

    it('limpa o histórico e traz os exemplos de volta', async () => {
      const user = userEvent.setup()
      executarSimulado.mockResolvedValue(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Texto retornado')

      await user.click(screen.getByRole('button', { name: 'Limpar histórico' }))

      expect(screen.queryByText('Texto retornado')).toBeNull()
      expect(screen.getByText('Comece por um exemplo')).toBeTruthy()
    })

    it('desabilita "Limpar histórico" durante um envio', async () => {
      const user = userEvent.setup()
      let resolver!: (resposta: OrquestracaoResponse) => void
      executarSimulado.mockResolvedValueOnce(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Texto retornado')

      executarSimulado.mockReturnValueOnce(
        new Promise<OrquestracaoResponse>((resolve) => {
          resolver = resolve
        }),
      )
      await user.type(campoPergunta(), 'Outra pergunta')
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))

      expect(
        (screen.getByRole('button', { name: 'Limpar histórico' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true)

      resolver(respostaDireta)
      await waitFor(() =>
        expect(
          (screen.getByRole('button', { name: 'Limpar histórico' }) as HTMLButtonElement)
            .disabled,
        ).toBe(false),
      )
    })

    it('não grava nada em localStorage nem em sessionStorage', async () => {
      const user = userEvent.setup()
      const localSet = vi.spyOn(Storage.prototype, 'setItem')
      executarSimulado.mockResolvedValue(respostaRh)
      render(<App />)

      await preencher(user)
      await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
      await screen.findByText('Texto retornado')
      await user.click(screen.getByRole('button', { name: 'Limpar histórico' }))

      expect(localSet).not.toHaveBeenCalled()
    })
  })
})
