import type { OrquestracaoResponse } from '../types/orquestrador'
import {
  formatarCusto,
  formatarDuracao,
  formatarTokens,
} from '../utils/formatadores'
import { ValorCopiavel } from './ValorCopiavel'

interface Props {
  resposta: OrquestracaoResponse
}

export function DetalhesExecucao({ resposta }: Props) {
  return (
    <section className="detalhes" aria-label="Dados da execução">
      <dl>
        <div>
          <dt>Tokens de entrada (orquestrador)</dt>
          <dd>{formatarTokens(resposta.tokensEntradaOrquestrador)}</dd>
        </div>
        <div>
          <dt>Tokens em cache (orquestrador)</dt>
          <dd>{formatarTokens(resposta.tokensCacheOrquestrador)}</dd>
        </div>
        <div>
          <dt>Tokens de saída (orquestrador)</dt>
          <dd>{formatarTokens(resposta.tokensSaidaOrquestrador)}</dd>
        </div>
        <div>
          <dt>Custo estimado do orquestrador (USD)</dt>
          <dd>
            {formatarCusto(resposta.custoOrquestradorUsd)}
            {resposta.destino === 'RH' && (
              <small className="nota">
                Não inclui o consumo do Agente RH.
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>Duração</dt>
          <dd>{formatarDuracao(resposta.duracaoMs)}</dd>
        </div>
        <div className="largura-total">
          <dt>idExecucao</dt>
          <dd>
            <ValorCopiavel rotulo="idExecucao" valor={resposta.idExecucao} />
          </dd>
        </div>
        <div className="largura-total">
          <dt>traceId</dt>
          <dd>
            <ValorCopiavel rotulo="traceId" valor={resposta.traceId} />
          </dd>
        </div>
      </dl>
    </section>
  )
}
