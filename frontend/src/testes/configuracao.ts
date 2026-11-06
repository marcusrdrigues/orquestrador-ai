import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sem "globals", o React Testing Library não limpa o DOM sozinho entre os testes.
afterEach(() => {
  cleanup()
})
