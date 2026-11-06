import type {
  FalhaApi,
  OrquestracaoResponse,
  PerguntaRequest,
} from '../types/orquestrador'

// Cobre o pior caso do backend: até 60 s no modelo de decisão + 90 s no Agente RH.
export const TIMEOUT_MS = 180_000

const ENDPOINT = '/api/orquestrador/executar'
const LIMITE_DETAIL = 300

// Lançada pelo serviço; a tela nunca precisa conhecer status HTTP.
export class ErroApi extends Error {
  readonly falha: FalhaApi

  constructor(falha: FalhaApi) {
    super(falha.mensagem)
    this.name = 'ErroApi'
    this.falha = falha
  }
}

const CAMPOS_TEXTO = [
  'idExecucao',
  'traceId',
  'agenteExecutado',
  'protocolo',
  'destino',
  'resposta',
] as const

const CAMPOS_NUMERO = [
  'tokensEntradaOrquestrador',
  'tokensCacheOrquestrador',
  'tokensSaidaOrquestrador',
  'custoOrquestradorUsd',
  'duracaoMs',
] as const

function ehRespostaValida(corpo: unknown): corpo is OrquestracaoResponse {
  if (typeof corpo !== 'object' || corpo === null) return false
  const objeto = corpo as Record<string, unknown>
  return (
    CAMPOS_TEXTO.every((campo) => typeof objeto[campo] === 'string') &&
    CAMPOS_NUMERO.every(
      (campo) =>
        typeof objeto[campo] === 'number' && Number.isFinite(objeto[campo]),
    )
  )
}

function tentarJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return undefined
  }
}

function extrairDetail(corpo: unknown): string | undefined {
  if (typeof corpo !== 'object' || corpo === null) return undefined
  const detail = (corpo as Record<string, unknown>).detail
  return typeof detail === 'string' && detail.trim() !== '' ? detail : undefined
}

// O backend embute "idExecucao=...; traceId=..." dentro do texto do detail.
function separarIdentificadores(detail: string): {
  mensagem: string
  idExecucao?: string
  traceId?: string
} {
  const idExecucao = /idExecucao=([^;\s]+)/.exec(detail)?.[1]
  const traceId = /traceId=([^;\s]+)/.exec(detail)?.[1]

  const mensagem = detail
    .replace(/\s*idExecucao=[^;\s]+;?/g, '')
    .replace(/\s*traceId=[^;\s]+;?/g, '')
    .trim()

  return {
    mensagem: mensagem.slice(0, LIMITE_DETAIL),
    idExecucao,
    traceId,
  }
}

function falhaDeStatus(status: number, texto: string): FalhaApi {
  if (status === 400) {
    return {
      categoria: 'validacao',
      mensagem:
        'A API recusou os dados enviados. Confira o nome e a pergunta.',
      statusHttp: status,
    }
  }

  const detail = status >= 500 ? extrairDetail(tentarJson(texto)) : undefined

  if (detail !== undefined) {
    const { mensagem, idExecucao, traceId } = separarIdentificadores(detail)
    return {
      categoria: 'execucao',
      mensagem:
        mensagem !== '' ? mensagem : 'A execução não pôde ser concluída.',
      idExecucao,
      traceId,
      statusHttp: status,
    }
  }

  return {
    categoria: 'indisponivel',
    mensagem: `A API não está disponível agora (HTTP ${status}).`,
    statusHttp: status,
  }
}

function falhaDeInterrupcao(
  estourou: boolean,
  mensagemIndisponivel: string,
): FalhaApi {
  if (estourou) {
    return {
      categoria: 'timeout',
      mensagem:
        'A API não respondeu em 3 minutos. A execução pode ter terminado no servidor. Envie de novo se quiser.',
    }
  }

  return { categoria: 'indisponivel', mensagem: mensagemIndisponivel }
}

// Única função do frontend que faz chamada HTTP. Uma chamada por execução; sem retry.
export async function executar(
  pedido: PerguntaRequest,
): Promise<OrquestracaoResponse> {
  const controle = new AbortController()
  let estourou = false

  const temporizador = setTimeout(() => {
    estourou = true
    controle.abort()
  }, TIMEOUT_MS)

  try {
    let resposta: Response

    try {
      resposta = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
        signal: controle.signal,
      })
    } catch {
      throw new ErroApi(
        falhaDeInterrupcao(
          estourou,
          'Não foi possível falar com a API. Confira se o backend está no ar.',
        ),
      )
    }

    let texto: string

    try {
      texto = await resposta.text()
    } catch {
      throw new ErroApi(
        falhaDeInterrupcao(
          estourou,
          'A conexão com a API foi interrompida antes do fim da resposta.',
        ),
      )
    }

    if (!resposta.ok) {
      throw new ErroApi(falhaDeStatus(resposta.status, texto))
    }

    const corpo = tentarJson(texto)

    if (!ehRespostaValida(corpo)) {
      throw new ErroApi({
        categoria: 'execucao',
        mensagem: 'A API devolveu uma resposta em formato inesperado.',
        statusHttp: resposta.status,
      })
    }

    return corpo
  } finally {
    clearTimeout(temporizador)
  }
}
