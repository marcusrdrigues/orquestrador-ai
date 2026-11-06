// Devolve o JSON formatado quando o texto é um objeto ou array JSON válido.
// Qualquer outra coisa (texto comum, JSON inválido, número, true, null, texto entre aspas)
// devolve null e deve ser exibida como texto comum.
export function formatarSeJson(texto: string): string | null {
  const limpo = texto.trim()

  if (!limpo.startsWith('{') && !limpo.startsWith('[')) return null

  try {
    const valor: unknown = JSON.parse(limpo)

    if (typeof valor !== 'object' || valor === null) return null

    return JSON.stringify(valor, null, 2)
  } catch {
    return null
  }
}
