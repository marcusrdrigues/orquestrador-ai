import { describe, expect, it } from 'vitest'
import { validarPergunta } from './validacao'

describe('validarPergunta', () => {
  it('aceita dados válidos e devolve o pedido sem espaços nas pontas', () => {
    const { erros, pedido } = validarPergunta('  Sergio  ', '  Como solicito férias?  ')

    expect(erros).toEqual({})
    expect(pedido).toEqual({
      usuario: 'Sergio',
      pergunta: 'Como solicito férias?',
    })
  })

  it('trata nome vazio e só com espaços como vazio', () => {
    expect(validarPergunta('', 'ok').erros.usuario).toBe('Informe o nome.')
    expect(validarPergunta('   ', 'ok').erros.usuario).toBe('Informe o nome.')
  })

  it('trata pergunta vazia e só com espaços como vazia', () => {
    expect(validarPergunta('Ana', '').erros.pergunta).toBe('Informe a pergunta.')
    expect(validarPergunta('Ana', '  \n ').erros.pergunta).toBe(
      'Informe a pergunta.',
    )
  })

  it('aceita nome com 120 caracteres e recusa com 121', () => {
    expect(validarPergunta('a'.repeat(120), 'ok').erros.usuario).toBeUndefined()
    expect(validarPergunta('a'.repeat(121), 'ok').erros.usuario).toBe(
      'O nome aceita até 120 caracteres.',
    )
  })

  it('aceita pergunta com 4000 caracteres e recusa com 4001', () => {
    expect(validarPergunta('Ana', 'p'.repeat(4000)).erros.pergunta).toBeUndefined()
    expect(validarPergunta('Ana', 'p'.repeat(4001)).erros.pergunta).toBe(
      'A pergunta aceita até 4000 caracteres.',
    )
  })

  it('não devolve pedido quando há erro', () => {
    expect(validarPergunta('', '').pedido).toBeUndefined()
    expect(validarPergunta('a'.repeat(121), 'ok').pedido).toBeUndefined()
  })

  it('conta o limite sem os espaços das pontas', () => {
    expect(
      validarPergunta(`  ${'a'.repeat(120)}  `, 'ok').erros.usuario,
    ).toBeUndefined()
  })
})
