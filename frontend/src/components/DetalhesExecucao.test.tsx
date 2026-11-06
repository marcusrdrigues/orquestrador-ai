import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { respostaDireta, respostaRh } from '../testes/fixtures'
import { DetalhesExecucao } from './DetalhesExecucao'

describe('DetalhesExecucao', () => {
  it('mostra tokens, custo, duração e identificadores com rótulos do orquestrador', () => {
    render(<DetalhesExecucao resposta={respostaRh} />)

    expect(screen.getByText('Tokens de entrada (orquestrador)')).toBeTruthy()
    expect(screen.getByText('450')).toBeTruthy()
    expect(screen.getByText('Tokens em cache (orquestrador)')).toBeTruthy()
    expect(screen.getByText('Tokens de saída (orquestrador)')).toBeTruthy()
    expect(screen.getByText('60')).toBeTruthy()
    expect(screen.getByText('Custo estimado do orquestrador (USD)')).toBeTruthy()
    expect(screen.getByText(/USD 0,000276/)).toBeTruthy()
    expect(screen.getByText('1.400 ms (1,4 s)')).toBeTruthy()
    expect(screen.getByText(respostaRh.idExecucao)).toBeTruthy()
    expect(screen.getByText(respostaRh.traceId)).toBeTruthy()
  })

  it('nunca apresenta o custo como total', () => {
    const { container } = render(<DetalhesExecucao resposta={respostaRh} />)

    expect(container.textContent?.toLowerCase()).not.toContain('custo total')
  })

  it('avisa que o consumo do Agente RH não está incluído quando o destino é RH', () => {
    render(<DetalhesExecucao resposta={respostaRh} />)

    expect(screen.getByText('Não inclui o consumo do Agente RH.')).toBeTruthy()
  })

  it('não mostra o aviso do RH quando o orquestrador respondeu direto', () => {
    render(<DetalhesExecucao resposta={respostaDireta} />)

    expect(screen.queryByText('Não inclui o consumo do Agente RH.')).toBeNull()
  })

  it('copia idExecucao e traceId sem alteração', async () => {
    const user = userEvent.setup()
    render(<DetalhesExecucao resposta={respostaRh} />)

    await user.click(screen.getByRole('button', { name: 'Copiar idExecucao' }))
    expect(await navigator.clipboard.readText()).toBe(respostaRh.idExecucao)

    await user.click(screen.getByRole('button', { name: 'Copiar traceId' }))
    expect(await navigator.clipboard.readText()).toBe(respostaRh.traceId)
  })
})
