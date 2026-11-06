import type { OrquestracaoResponse } from '../types/orquestrador'

// Dados de exemplo só para testes automatizados; a entrega usa sempre a API real.
export const respostaRh: OrquestracaoResponse = {
  idExecucao: '11111111-1111-1111-1111-111111111111',
  traceId: 'trace-abc-123',
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

export const respostaDireta: OrquestracaoResponse = {
  ...respostaRh,
  idExecucao: '22222222-2222-2222-2222-222222222222',
  traceId: 'trace-def-456',
  agenteExecutado: 'Orquestrador AI',
  protocolo: 'RESPOSTA_DIRETA',
  destino: 'DIRETO',
  resposta: 'Uma API REST é um estilo de arquitetura.',
}
