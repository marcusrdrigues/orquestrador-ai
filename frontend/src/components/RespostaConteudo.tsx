import { formatarSeJson } from '../utils/respostaJson'

interface Props {
  texto: string
}

// A resposta do modelo é conteúdo não confiável: entra no DOM só como texto.
export function RespostaConteudo({ texto }: Props) {
  const json = formatarSeJson(texto)

  if (json !== null) {
    return (
      <details className="resposta-json">
        <summary>Resposta em JSON (expandir)</summary>
        <pre>{json}</pre>
      </details>
    )
  }

  return <p className="resposta-texto">{texto}</p>
}
