import { useState, type FormEvent, type RefObject } from 'react'
import type { PerguntaRequest } from '../types/orquestrador'
import {
  LIMITE_PERGUNTA,
  LIMITE_USUARIO,
  validarPergunta,
  type ErrosDeCampo,
} from '../utils/validacao'

interface Props {
  usuario: string
  pergunta: string
  enviando: boolean
  campoPerguntaRef: RefObject<HTMLTextAreaElement | null>
  onUsuarioChange: (valor: string) => void
  onPerguntaChange: (valor: string) => void
  onEnviar: (pedido: PerguntaRequest) => void
}

export function FormularioPergunta({
  usuario,
  pergunta,
  enviando,
  campoPerguntaRef,
  onUsuarioChange,
  onPerguntaChange,
  onEnviar,
}: Props) {
  const [erros, setErros] = useState<ErrosDeCampo>({})

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (enviando) return

    const resultado = validarPergunta(usuario, pergunta)
    setErros(resultado.erros)

    if (resultado.pedido) onEnviar(resultado.pedido)
  }

  function alterarUsuario(valor: string) {
    setErros((atuais) => ({ ...atuais, usuario: undefined }))
    onUsuarioChange(valor)
  }

  function alterarPergunta(valor: string) {
    setErros((atuais) => ({ ...atuais, pergunta: undefined }))
    onPerguntaChange(valor)
  }

  const tamanhoUsuario = usuario.trim().length
  const tamanhoPergunta = pergunta.trim().length

  return (
    <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label htmlFor="campo-usuario">Nome do usuário</label>
        <input
          id="campo-usuario"
          type="text"
          autoComplete="off"
          value={usuario}
          readOnly={enviando}
          aria-invalid={erros.usuario ? true : undefined}
          aria-describedby={
            erros.usuario
              ? 'contador-usuario erro-usuario'
              : 'contador-usuario'
          }
          onChange={(evento) => alterarUsuario(evento.target.value)}
        />
        <div className="campo-rodape">
          {erros.usuario && (
            <p id="erro-usuario" className="erro-campo">
              {erros.usuario}
            </p>
          )}
          <span
            id="contador-usuario"
            className={
              tamanhoUsuario > LIMITE_USUARIO ? 'contador excedido' : 'contador'
            }
          >
            {tamanhoUsuario}/{LIMITE_USUARIO}
          </span>
        </div>
      </div>

      <div className="campo">
        <label htmlFor="campo-pergunta">Pergunta</label>
        <textarea
          id="campo-pergunta"
          ref={campoPerguntaRef}
          rows={4}
          value={pergunta}
          readOnly={enviando}
          aria-invalid={erros.pergunta ? true : undefined}
          aria-describedby={
            erros.pergunta
              ? 'contador-pergunta erro-pergunta'
              : 'contador-pergunta'
          }
          onChange={(evento) => alterarPergunta(evento.target.value)}
        />
        <div className="campo-rodape">
          {erros.pergunta && (
            <p id="erro-pergunta" className="erro-campo">
              {erros.pergunta}
            </p>
          )}
          <span
            id="contador-pergunta"
            className={
              tamanhoPergunta > LIMITE_PERGUNTA
                ? 'contador excedido'
                : 'contador'
            }
          >
            {tamanhoPergunta}/{LIMITE_PERGUNTA}
          </span>
        </div>
      </div>

      <div className="acoes">
        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar pergunta'}
        </button>
        {enviando && (
          <span className="indicador" aria-hidden="true">
            <span className="indicador-bolinha" />
            Aguardando o orquestrador…
          </span>
        )}
      </div>
    </form>
  )
}
