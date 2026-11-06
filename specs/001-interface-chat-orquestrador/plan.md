# Implementation Plan: Interface web do Orquestrador AI

**Branch**: `001-interface-chat-orquestrador` (nenhuma branch criada; sem commit nesta atividade) | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-interface-chat-orquestrador/spec.md`

## Summary

Uma página única em React + TypeScript, na pasta `frontend/`, que envia `usuario` e `pergunta` a
`POST /api/orquestrador/executar` e mostra a resposta, o agente que respondeu, os tokens, o custo do
orquestrador, a duração, `idExecucao` e `traceId`. O histórico vive só em memória. O navegador chama
caminhos relativos `/api`, e o servidor de desenvolvimento do Vite encaminha para
`http://localhost:8083`. Isso evita CORS sem tocar no Java. Toda chamada HTTP fica em
`src/services/orquestradorApi.ts`, que também classifica os erros nas quatro categorias da spec.

Nível de solução (regra de engenharia de IA): não há LLM no frontend. O modelo e o RAG continuam
no backend; a tela só consome o resultado, então não se aplicam eval, prompt nem limites de modelo
aqui.

## Technical Context

**Language/Version**: TypeScript em modo estrito; Node v24.22.1 instalado (Vite 7 e 8 exigem
Node `^20.19.0 || >=22.12.0`, conferido na documentação do Vite).

**Primary Dependencies**: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`
(e os tipos de React). Sem Redux, sem React Router, sem biblioteca de componentes ou de HTTP.
Versões exatas ficam por conta da instalação: conferir a versão estável atual com `npm view`
e fixar sem `^`.

**Storage**: N/A. O histórico fica em estado do React; nada vai a `localStorage`, `sessionStorage`
nem cookie.

**Testing**: Vitest com React Testing Library, `@testing-library/user-event` e `jsdom`, todos
como dependências de desenvolvimento. **Precisam de aprovação sua antes de instalar** (ver
Complexity Tracking). O `fetch` é simulado só nos testes do serviço, para provocar status e falhas
que não dá para forçar à vontade na API real; a validação de ponta a ponta usa o backend real
(quickstart).

**Target Platform**: Navegador moderno em desktop e celular (a partir de 320 px). Somente servidor
de desenvolvimento local; publicação está fora do escopo.

**Project Type**: Aplicação web (frontend) acrescentada a um backend Spring Boot existente.

**Performance Goals**: Nenhum além de resposta imediata da interface. A latência é a do backend
(decisão do modelo e, para RH, chamada ao agente).

**Constraints**:
- Timeout da chamada: **180 s**, definido por você. Cobre o pior caso do backend, que soma
  até 60 s de leitura do modelo de decisão e 90 s do Agente RH.
- Sem retry automático.
- Porta 5173 fixa com `strictPort`.
- Prefixo `/api` preservado pelo proxy, sem `rewrite`.
- Backend inalterado.

**Scale/Scope**: 1 tela, 1 endpoint, cerca de 8 componentes. Cabe em uma aula de uma hora.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano atende | Situação |
|---|---|---|
| I. Preservar a API | Nenhum arquivo Java muda. Nomes dos campos conferidos em `OrquestracaoResponse` e `PerguntaRequest`. | Passa |
| II. Pasta `frontend` | Tudo em `frontend/`, nada em `src/` do Java. | Passa |
| III. Simples, acessível, responsiva | HTML semântico, `label`, `aria-live`, `role="alert"`, foco visível, CSS responsivo desde 320 px. | Passa |
| IV. HTTP só no serviço | `src/services/orquestradorApi.ts` é o único arquivo com `fetch`. | Passa |
| V. Sem chave da OpenAI | O frontend só conhece `/api`. Nenhuma variável de ambiente nem `.env`. | Passa |
| VI. API real, sem mocks | Entrega validada contra o backend (quickstart). Mock de `fetch` só em teste do serviço. | Passa |
| VII. Carregando, erro, indisponível | `enviando`, timeout próprio e mapeamento de erros (contracts). | Passa |
| VIII. Dependências mínimas | 5 dependências de execução/construção e 4 de teste, todas justificadas abaixo. | Passa, com aprovação pendente das de teste |
| IX. Custo com precisão | Mínimo 6 e máximo 8 casas decimais. Ver o ponto abaixo. | Passa |
| X. Backend só se indispensável | O proxy resolve o CORS. Nenhuma mudança prevista. | Passa |
| XI. Sem commit nem publicação | Nada de commit, push nem deploy. | Passa |

**Conciliação entre o seu pedido e a constituição:** você pediu "até 8 casas" e a constituição
(princípio IX) exige no mínimo 6. Os dois valem juntos: o custo mostra de 6 a 8 casas, nunca
arredondado a 2 e nunca em notação científica. Um custo positivo menor que 0,00000001 aparece como
"< 0,00000001", para não parecer zero. Com o preço configurado no backend (a partir de 0,10 USD
por milhão de tokens) o menor custo possível é cerca de 0,0000001, então esse caso é só proteção.

**Atualização da spec:** a Assumption de timeout da spec dizia 120 s. Passou a 180 s, conforme a
sua decisão. Foi o único ajuste.

**Re-check após o design (Fase 1):** sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/001-interface-chat-orquestrador/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── api-orquestrador.md   # Contrato consumido e mapeamento de erros
│   └── exibicao.md           # Regras de exibição (custo, duração, JSON, avisos)
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks, não criado aqui)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts            # proxy /api -> http://localhost:8083, porta 5173 strictPort, config do Vitest
├── .gitignore                # node_modules, dist
└── src/
    ├── main.tsx
    ├── App.tsx               # estado da página: histórico, envio em andamento, exemplos
    ├── App.css               # tema claro, destaque azul, cartões discretos
    ├── types/
    │   └── orquestrador.ts   # PerguntaRequest, OrquestracaoResponse, FalhaApi, EntradaHistorico
    ├── services/
    │   ├── orquestradorApi.ts        # único ponto de fetch, timeout, classificação de erros
    │   └── orquestradorApi.test.ts
    ├── utils/
    │   ├── formatadores.ts           # custo, duração, tokens
    │   ├── formatadores.test.ts
    │   ├── respostaJson.ts           # detecta e formata JSON dentro da resposta
    │   ├── respostaJson.test.ts
    │   ├── validacao.ts              # nome e pergunta (obrigatório, limites)
    │   └── validacao.test.ts
    └── components/
        ├── FormularioPergunta.tsx    # campos, contadores, erros de validação, botão
        ├── ExemplosPerguntas.tsx     # tela inicial com os 3 exemplos
        ├── AvisoHistorico.tsx        # "registro visual, sem memória do agente"
        ├── Historico.tsx             # lista cronológica + botão limpar
        ├── EntradaHistorico.tsx      # cartão: pergunta + resultado
        ├── DetalhesExecucao.tsx      # agente, tokens, custo, duração, idExecucao, traceId
        ├── RespostaConteudo.tsx      # texto simples ou bloco JSON expansível
        ├── MensagemFalha.tsx         # erro por categoria
        └── *.test.tsx                # testes de comportamento dos componentes principais
```

**Structure Decision**: Aplicação web com backend existente e uma pasta `frontend/` nova e
independente. A estrutura segue a sua sugestão, com dois acréscimos: `src/utils/` (funções puras
testáveis, para o serviço ficar só com HTTP) e `src/main.tsx` (ponto de entrada do Vite).

## Decisões de arquitetura

1. **Proxy do Vite em vez de CORS no backend.** Descartei adicionar CORS no Java porque seria uma
   mudança de backend sem necessidade (princípio X) e ainda abriria a API a outras origens. O
   proxy só vale no servidor de desenvolvimento, o que basta para a aula.
2. **Timeout com `AbortController` e `setTimeout`.** Descartei `AbortSignal.timeout()` porque o
   `setTimeout` explícito permite testar o tempo limite com relógio falso e distinguir "tempo
   esgotado" de qualquer outro cancelamento.
3. **Estado com `useState`/`useReducer` no `App`.** Descartei Redux e Context: há uma tela e um
   estado pequeno. O envio é protegido por um `ref` além de `disabled`, porque dois Enter seguidos
   podem entrar antes de o React atualizar o botão.
4. **Classificação de erro centralizada no serviço.** A tela recebe um objeto `FalhaApi` já
   categorizado e não conhece status HTTP.
5. **Resposta do modelo é conteúdo não confiável.** Entra no DOM só como texto (`pre-wrap`) ou
   dentro de `<pre>`, sem HTML interpretado. Não se usa `dangerouslySetInnerHTML`.

## Complexity Tracking

Sem violações da constituição. Um ponto de aprovação, pela regra de dependências:

| Dependência | Para que serve | Mantida? | Licença |
|---|---|---|---|
| `vitest` | Rodar os testes dentro da configuração do Vite | Mantida pela equipe do Vite | MIT (a conferir na instalação) |
| `@testing-library/react` | Testar componentes pelo comportamento | Mantida | MIT (a conferir) |
| `@testing-library/user-event` | Simular digitação, clique e Enter | Mantida | MIT (a conferir) |
| `jsdom` | Ambiente de DOM para os testes | Mantida | MIT (a conferir) |

Licença e manutenção são do meu conhecimento prévio e **não foram conferidas** nesta sessão;
conferir no `npm view` antes de instalar. Alternativa descartada: testar só funções puras e deixar
a interface sem teste, o que descumpriria a regra de teste para comportamento novo.
