import { useEffect, useRef } from 'react'
import type { EntradaHistorico as Entrada } from '../types/orquestrador'
import { AvisoHistorico } from './AvisoHistorico'
import { EntradaHistorico } from './EntradaHistorico'

interface Props {
  entradas: Entrada[]
  enviando: boolean
  onLimpar: () => void
}

// Ordem cronológica: a mais antiga no alto, a mais recente embaixo.
export function Historico({ entradas, enviando, onLimpar }: Props) {
  const ultimaRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    const ultima = ultimaRef.current
    if (ultima && typeof ultima.scrollIntoView === 'function') {
      ultima.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [entradas.length])

  return (
    <section className="historico" aria-labelledby="titulo-historico">
      <div className="historico-topo">
        <h2 id="titulo-historico">Histórico desta página</h2>
        <button
          type="button"
          className="botao-secundario"
          disabled={enviando}
          onClick={onLimpar}
        >
          Limpar histórico
        </button>
      </div>

      <AvisoHistorico />

      <ol className="lista-historico">
        {entradas.map((entrada, indice) => (
          <li
            key={entrada.id}
            ref={indice === entradas.length - 1 ? ultimaRef : undefined}
          >
            <EntradaHistorico entrada={entrada} />
          </li>
        ))}
      </ol>
    </section>
  )
}
