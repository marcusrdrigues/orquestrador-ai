// Custo: de 6 a 8 casas decimais, em USD, sem arredondar para 2 casas e sem notação científica.
const MENOR_CUSTO_EXIBIVEL = 0.00000001

const formatoCusto = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 8,
})

const formatoInteiro = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const formatoSegundos = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

// Sem valor (falha, sem consumo retornado) é "desconhecido", nunca zero.
export function formatarCusto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return 'Custo desconhecido'
  }

  if (valor > 0 && valor < MENOR_CUSTO_EXIBIVEL) return 'USD < 0,00000001'

  return `USD ${formatoCusto.format(valor)}`
}

export function formatarDuracao(milissegundos: number): string {
  return `${formatoInteiro.format(milissegundos)} ms (${formatoSegundos.format(
    milissegundos / 1000,
  )} s)`
}

export function formatarTokens(quantidade: number): string {
  return formatoInteiro.format(quantidade)
}

export function formatarHora(data: Date): string {
  return formatoHora.format(data)
}
