export const EXEMPLOS = [
  'Olá! O que você pode fazer?',
  'Explique o que é uma API REST.',
  'Como solicito férias?',
] as const

interface Props {
  onEscolher: (pergunta: string) => void
}

// Escolher um exemplo só preenche o campo; o envio é decisão da pessoa (cada envio gera custo).
export function ExemplosPerguntas({ onEscolher }: Props) {
  return (
    <section className="cartao exemplos" aria-labelledby="titulo-exemplos">
      <h2 id="titulo-exemplos">Comece por um exemplo</h2>
      <p className="apoio">
        Escolha uma pergunta para preencher o campo. Nada é enviado até você
        confirmar.
      </p>
      <ul>
        {EXEMPLOS.map((exemplo) => (
          <li key={exemplo}>
            <button
              type="button"
              className="botao-exemplo"
              onClick={() => onEscolher(exemplo)}
            >
              {exemplo}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
