import type { EntradaHistorico as Entrada } from '../types/orquestrador'
import { formatarHora } from '../utils/formatadores'
import { DetalhesExecucao } from './DetalhesExecucao'
import { MensagemFalha } from './MensagemFalha'
import { RespostaConteudo } from './RespostaConteudo'

interface Props {
  entrada: Entrada
}

export function EntradaHistorico({ entrada }: Props) {
  const { resultado } = entrada

  return (
    <article className="cartao entrada">
      <header className="entrada-cabecalho">
        <span>
          <strong>{entrada.usuario}</strong> perguntou
        </span>
        <time dateTime={entrada.enviadaEm.toISOString()}>
          {formatarHora(entrada.enviadaEm)}
        </time>
      </header>

      <p className="entrada-pergunta">{entrada.pergunta}</p>

      {resultado.tipo === 'sucesso' ? (
        <>
          <p className="agente">
            <span className="selo">{resultado.resposta.agenteExecutado}</span>
            <small>
              destino {resultado.resposta.destino} · protocolo{' '}
              {resultado.resposta.protocolo}
            </small>
          </p>
          <RespostaConteudo texto={resultado.resposta.resposta} />
          <DetalhesExecucao resposta={resultado.resposta} />
        </>
      ) : (
        <MensagemFalha falha={resultado.falha} />
      )}
    </article>
  )
}
