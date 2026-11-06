// Contrato real da API (OrquestradorController / PerguntaRequest / OrquestracaoResponse).

export interface PerguntaRequest {
  usuario: string
  pergunta: string
}

export interface OrquestracaoResponse {
  idExecucao: string
  traceId: string
  agenteExecutado: string
  protocolo: string
  destino: string
  resposta: string
  tokensEntradaOrquestrador: number
  tokensCacheOrquestrador: number
  tokensSaidaOrquestrador: number
  // Custo apenas da decisão do orquestrador; não inclui o consumo do Agente RH.
  custoOrquestradorUsd: number
  duracaoMs: number
}

export type CategoriaFalha =
  | 'validacao'
  | 'execucao'
  | 'indisponivel'
  | 'timeout'

// Uma falha nunca traz consumo, por isso não há campo de custo aqui.
export interface FalhaApi {
  categoria: CategoriaFalha
  mensagem: string
  idExecucao?: string
  traceId?: string
  statusHttp?: number
}

export type ResultadoEntrada =
  | { tipo: 'sucesso'; resposta: OrquestracaoResponse }
  | { tipo: 'falha'; falha: FalhaApi }

export interface EntradaHistorico {
  id: string
  usuario: string
  pergunta: string
  enviadaEm: Date
  resultado: ResultadoEntrada
}
