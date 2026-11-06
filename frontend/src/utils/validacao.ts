import type { PerguntaRequest } from '../types/orquestrador'

// usuario: obrigatório, sem espaços nas pontas, 1 a 120 caracteres.
// pergunta: obrigatória, sem espaços nas pontas, 1 a 4000 caracteres.
// É conveniência de uso; a validação que vale é a do backend.
export const LIMITE_USUARIO = 120
export const LIMITE_PERGUNTA = 4000

export interface ErrosDeCampo {
  usuario?: string
  pergunta?: string
}

export interface ResultadoValidacao {
  erros: ErrosDeCampo
  // Presente somente quando não há erro; já sem espaços nas pontas.
  pedido?: PerguntaRequest
}

export function validarPergunta(
  usuario: string,
  pergunta: string,
): ResultadoValidacao {
  const usuarioLimpo = usuario.trim()
  const perguntaLimpa = pergunta.trim()
  const erros: ErrosDeCampo = {}

  if (usuarioLimpo.length === 0) {
    erros.usuario = 'Informe o nome.'
  } else if (usuarioLimpo.length > LIMITE_USUARIO) {
    erros.usuario = `O nome aceita até ${LIMITE_USUARIO} caracteres.`
  }

  if (perguntaLimpa.length === 0) {
    erros.pergunta = 'Informe a pergunta.'
  } else if (perguntaLimpa.length > LIMITE_PERGUNTA) {
    erros.pergunta = `A pergunta aceita até ${LIMITE_PERGUNTA} caracteres.`
  }

  if (erros.usuario || erros.pergunta) return { erros }

  return {
    erros,
    pedido: { usuario: usuarioLimpo, pergunta: perguntaLimpa },
  }
}
