import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CategoriaFalha } from '../types/orquestrador'
import { MensagemFalha } from './MensagemFalha'

const titulos: Array<[CategoriaFalha, string]> = [
  ['validacao', 'Dado inválido'],
  ['execucao', 'Falha na execução'],
  ['indisponivel', 'API indisponível'],
  ['timeout', 'Tempo esgotado'],
]

describe('MensagemFalha', () => {
  it.each(titulos)('mostra o título e a mensagem da categoria %s', (categoria, titulo) => {
    render(<MensagemFalha falha={{ categoria, mensagem: 'Mensagem de teste.' }} />)

    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).toContain(titulo)
    expect(alerta.textContent).toContain('Mensagem de teste.')
  })

  it('mostra custo desconhecido em toda falha, nunca zero', () => {
    render(<MensagemFalha falha={{ categoria: 'timeout', mensagem: 'Sem resposta.' }} />)

    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).toContain('Custo desconhecido')
    expect(alerta.textContent).not.toContain('0,000000')
  })

  it('mostra idExecucao e traceId quando existem', () => {
    render(
      <MensagemFalha
        falha={{
          categoria: 'execucao',
          mensagem: 'Falhou.',
          idExecucao: 'id-123',
          traceId: 'trace-456',
        }}
      />,
    )

    expect(screen.getByText('id-123')).toBeTruthy()
    expect(screen.getByText('trace-456')).toBeTruthy()
  })

  it('não mostra os campos de identificadores quando faltam', () => {
    render(<MensagemFalha falha={{ categoria: 'execucao', mensagem: 'Falhou.' }} />)

    expect(screen.queryByText('idExecucao')).toBeNull()
    expect(screen.queryByText('traceId')).toBeNull()
  })

  it('exibe a mensagem como texto, sem interpretar HTML', () => {
    const { container } = render(
      <MensagemFalha
        falha={{ categoria: 'execucao', mensagem: '<img src=x onerror=alert(1)>' }}
      />,
    )

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy()
  })
})
