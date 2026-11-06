import type { CategoriaFalha, FalhaApi } from '../types/orquestrador'
import { formatarCusto } from '../utils/formatadores'
import { ValorCopiavel } from './ValorCopiavel'

const TITULOS: Record<CategoriaFalha, string> = {
  validacao: 'Dado inválido',
  execucao: 'Falha na execução',
  indisponivel: 'API indisponível',
  timeout: 'Tempo esgotado',
}

interface Props {
  falha: FalhaApi
}

export function MensagemFalha({ falha }: Props) {
  return (
    <div className="falha" role="alert">
      <h3>{TITULOS[falha.categoria]}</h3>
      <p>{falha.mensagem}</p>

      {(falha.idExecucao || falha.traceId) && (
        <dl className="falha-ids">
          {falha.idExecucao && (
            <div>
              <dt>idExecucao</dt>
              <dd>
                <ValorCopiavel rotulo="idExecucao" valor={falha.idExecucao} />
              </dd>
            </div>
          )}
          {falha.traceId && (
            <div>
              <dt>traceId</dt>
              <dd>
                <ValorCopiavel rotulo="traceId" valor={falha.traceId} />
              </dd>
            </div>
          )}
        </dl>
      )}

      <p className="falha-custo">
        {formatarCusto(undefined)}
        <small className="nota">
          A API não devolveu consumo para esta execução.
        </small>
      </p>
    </div>
  )
}
