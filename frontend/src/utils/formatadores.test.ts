import { describe, expect, it } from 'vitest'
import { formatarCusto, formatarDuracao, formatarTokens } from './formatadores'

describe('formatarCusto', () => {
  it.each([
    [0.000276, 'USD 0,000276'],
    [2.76e-4, 'USD 0,000276'],
    [0.00012345678, 'USD 0,00012346'],
    [0.1, 'USD 0,100000'],
    [0, 'USD 0,000000'],
    [0.000000004, 'USD < 0,00000001'],
  ])('formata %s como "%s"', (valor, esperado) => {
    expect(formatarCusto(valor)).toBe(esperado)
  })

  it('mostra "Custo desconhecido" sem valor, nunca zero', () => {
    expect(formatarCusto(undefined)).toBe('Custo desconhecido')
    expect(formatarCusto(null)).toBe('Custo desconhecido')
    expect(formatarCusto(Number.NaN)).toBe('Custo desconhecido')
  })

  it('nunca usa notação científica nem arredonda para 2 casas', () => {
    const texto = formatarCusto(0.0000001)

    expect(texto).toBe('USD 0,0000001')
    expect(texto).not.toMatch(/e/i)
  })
})

describe('formatarDuracao', () => {
  it('mostra milissegundos e segundos', () => {
    expect(formatarDuracao(1400)).toBe('1.400 ms (1,4 s)')
    expect(formatarDuracao(65200)).toBe('65.200 ms (65,2 s)')
    expect(formatarDuracao(800)).toBe('800 ms (0,8 s)')
  })
})

describe('formatarTokens', () => {
  it('usa separador de milhar', () => {
    expect(formatarTokens(450)).toBe('450')
    expect(formatarTokens(12345)).toBe('12.345')
  })
})
