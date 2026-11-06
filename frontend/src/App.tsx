import { useRef, useState } from 'react'
import './App.css'
import { ExemplosPerguntas } from './components/ExemplosPerguntas'
import { FormularioPergunta } from './components/FormularioPergunta'
import { Historico } from './components/Historico'
import { ErroApi, executar } from './services/orquestradorApi'
import type {
  EntradaHistorico,
  FalhaApi,
  PerguntaRequest,
  ResultadoEntrada,
} from './types/orquestrador'

const FALHA_INESPERADA: FalhaApi = {
  categoria: 'execucao',
  mensagem: 'Ocorreu um erro inesperado na tela. Tente novamente.',
}

function App() {
  const [entradas, setEntradas] = useState<EntradaHistorico[]>([])
  const [enviando, setEnviando] = useState(false)
  const [usuario, setUsuario] = useState('')
  const [pergunta, setPergunta] = useState('')
  const [anuncio, setAnuncio] = useState('')

  // O ref bloqueia um segundo envio antes de o React atualizar o botão (Enter repetido).
  const emAndamento = useRef(false)
  const contador = useRef(0)
  const campoPerguntaRef = useRef<HTMLTextAreaElement | null>(null)

  function registrar(pedido: PerguntaRequest, resultado: ResultadoEntrada) {
    contador.current += 1

    const entrada: EntradaHistorico = {
      id: `entrada-${contador.current}`,
      usuario: pedido.usuario,
      pergunta: pedido.pergunta,
      enviadaEm: new Date(),
      resultado,
    }

    setEntradas((atuais) => [...atuais, entrada])
  }

  async function enviar(pedido: PerguntaRequest) {
    if (emAndamento.current) return

    emAndamento.current = true
    setEnviando(true)
    setAnuncio('Enviando pergunta ao orquestrador')

    try {
      const resposta = await executar(pedido)

      registrar(pedido, { tipo: 'sucesso', resposta })
      setPergunta('')
      setAnuncio(`Resposta recebida de ${resposta.agenteExecutado}`)
    } catch (erro) {
      const falha = erro instanceof ErroApi ? erro.falha : FALHA_INESPERADA

      // Em falha a pergunta continua no campo; o reenvio é sempre uma ação da pessoa.
      registrar(pedido, { tipo: 'falha', falha })
      setAnuncio(`Falha ao obter a resposta: ${falha.mensagem}`)
    } finally {
      emAndamento.current = false
      setEnviando(false)
    }
  }

  function escolherExemplo(texto: string) {
    setPergunta(texto)
    campoPerguntaRef.current?.focus()
  }

  function limpar() {
    if (emAndamento.current) return

    setEntradas([])
    setAnuncio('Histórico limpo')
  }

  return (
    <main className="pagina">
      <header className="topo">
        <h1>Orquestrador AI</h1>
        <p>Faça uma pergunta e veja qual agente respondeu e quanto a decisão consumiu.</p>
      </header>

      <FormularioPergunta
        usuario={usuario}
        pergunta={pergunta}
        enviando={enviando}
        campoPerguntaRef={campoPerguntaRef}
        onUsuarioChange={setUsuario}
        onPerguntaChange={setPergunta}
        onEnviar={enviar}
      />

      <p className="somente-leitor" role="status" aria-live="polite">
        {anuncio}
      </p>

      {entradas.length === 0 ? (
        <ExemplosPerguntas onEscolher={escolherExemplo} />
      ) : (
        <Historico entradas={entradas} enviando={enviando} onLimpar={limpar} />
      )}
    </main>
  )
}

export default App
