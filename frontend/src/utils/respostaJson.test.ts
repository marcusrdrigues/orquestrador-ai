import { describe, expect, it } from 'vitest'
import { formatarSeJson } from './respostaJson'

describe('formatarSeJson', () => {
  it('formata objeto JSON válido', () => {
    expect(formatarSeJson('{"a":1,"b":[2,3]}')).toBe(
      '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
    )
  })

  it('formata array JSON válido, ignorando espaços nas pontas', () => {
    expect(formatarSeJson('  [1,2]\n')).toBe('[\n  1,\n  2\n]')
  })

  it('devolve null para texto comum', () => {
    expect(formatarSeJson('Você tem direito a 30 dias de férias.')).toBeNull()
  })

  it('devolve null quando começa com { mas não é JSON válido', () => {
    expect(formatarSeJson('{não é json}')).toBeNull()
  })

  it('devolve null para valores simples que são JSON válido', () => {
    expect(formatarSeJson('123')).toBeNull()
    expect(formatarSeJson('true')).toBeNull()
    expect(formatarSeJson('null')).toBeNull()
    expect(formatarSeJson('"texto"')).toBeNull()
  })

  it('não interpreta HTML: texto com marcação continua sendo texto', () => {
    expect(formatarSeJson('<script>alert(1)</script>')).toBeNull()
  })
})
