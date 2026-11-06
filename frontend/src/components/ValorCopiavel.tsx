import { useState } from 'react'

interface Props {
  rotulo: string
  valor: string
}

// Mostra um identificador selecionável e o botão que copia o valor sem alterá-lo.
export function ValorCopiavel({ rotulo, valor }: Props) {
  const [aviso, setAviso] = useState('')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor)
      setAviso('Copiado.')
    } catch {
      setAviso('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }

  return (
    <span className="valor-copiavel">
      <code>{valor}</code>
      <button
        type="button"
        className="botao-secundario"
        aria-label={`Copiar ${rotulo}`}
        onClick={copiar}
      >
        Copiar
      </button>
      <span role="status" className="aviso-copia">
        {aviso}
      </span>
    </span>
  )
}
