---

description: "Tarefas da interface web do Orquestrador AI"
---

# Tasks: Interface web do Orquestrador AI

**Input**: Design documents from `/specs/001-interface-chat-orquestrador/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos. A constituição e a regra do projeto exigem teste para comportamento novo. Dependem da aprovação das dependências de teste (T001). Se elas forem recusadas, as tarefas de teste saem e a regra de teste precisa ser decidida de novo.

**Organization**: Tarefas agrupadas por história de usuário. A ordem das fases segue a prioridade (P1 → P3) e cada fase termina com um ponto de verificação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1 a US5)
- Todos os caminhos são relativos à raiz do repositório
- **Sem commit e sem publicação** (princípio XI). Nenhuma tarefa cria commit, push nem deploy.

## Mapa dos seus 8 passos

| Seu passo | Onde está |
|---|---|
| 1. Criar o projeto React com Vite | Fase 1 (T002 a T004) |
| 2. Configurar o proxy | Fase 1 (T005) |
| 3. Criar os tipos do contrato | Fase 2 (T006) |
| 4. Serviço HTTP com timeout e erros | Fase 2 (T007, T008) |
| 5. Formulário e histórico visual | Fase 3 (US1) e Fase 7 (US5) |
| 6. Resposta e dados da execução | Fase 3 (US1), Fase 4 (US2) e Fase 5 (US3) |
| 7. Layout responsivo | Fase 8 (T036) |
| 8. Build e critérios de aceite | Fase 8 (T039 a T042) |

## Path Conventions

Aplicação web: tudo em `frontend/` (princípio II). O backend em `src/` do Java **não é tocado**.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Projeto Vite no ar, com proxy funcionando.

- [X] T001 Obter a aprovação do Marcus para as dependências de desenvolvimento `vitest`, `@testing-library/react`, `@testing-library/user-event` e `jsdom` (para que servem, manutenção e licença estão em `specs/001-interface-chat-orquestrador/plan.md`, seção Complexity Tracking). Conferir com `npm view` a licença e a última publicação de cada uma antes de instalar. Não instalar sem o OK.
- [X] T002 Criar o projeto em `frontend/` com o modelo React + TypeScript do Vite (`npm create vite@latest frontend -- --template react-ts`), gerando `frontend/package.json`, `frontend/tsconfig.json`, `frontend/index.html` e `frontend/src/main.tsx`. Confirmar no `package.json` que `react`, `react-dom`, `vite`, `typescript` e `@vitejs/plugin-react` são as únicas dependências de execução e construção.
- [X] T003 Em `frontend/package.json`, fixar as versões exatas (remover `^` e `~`) das dependências instaladas, e garantir o modo estrito em `frontend/tsconfig.json`. Criar `frontend/.gitignore` com `node_modules` e `dist`.
- [X] T004 Remover o conteúdo de demonstração do modelo: apagar `frontend/src/assets/`, deixar `frontend/src/App.tsx` com um componente mínimo, criar `frontend/src/App.css` vazio e ajustar `frontend/src/main.tsx` para importar `App.css`. Apagar `frontend/src/index.css` se existir.
- [X] T005 Configurar `frontend/vite.config.ts`: `server.port: 5173`, `server.strictPort: true` e `server.proxy` com a chave `'/api'` e `target: 'http://localhost:8083'`, **sem `rewrite` e sem `changeOrigin`**. Acrescentar também o bloco `test` do Vitest com `environment: 'jsdom'` (só depois da aprovação de T001) e o script `"test": "vitest run"` em `frontend/package.json`.

**Checkpoint**: com o backend rodando, `npm run dev` sobe em `http://localhost:5173` e `GET http://localhost:5173/api/orquestrador/status` devolve 200 com `"status":"Executando"`. Esse endpoint não chama a OpenAI, então a verificação do proxy não gera custo. Com a 5173 ocupada, o Vite deve falhar em vez de trocar de porta.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos e serviço HTTP, de que todas as histórias dependem.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

- [X] T006 Criar `frontend/src/types/orquestrador.ts` com os tipos de `specs/001-interface-chat-orquestrador/data-model.md`: `PerguntaRequest` (`usuario`, `pergunta`), `OrquestracaoResponse` (os 11 campos com os nomes exatos: `idExecucao`, `traceId`, `agenteExecutado`, `protocolo`, `destino`, `resposta`, `tokensEntradaOrquestrador`, `tokensCacheOrquestrador`, `tokensSaidaOrquestrador`, `custoOrquestradorUsd`, `duracaoMs`), `FalhaApi` (`categoria`: `validacao` | `execucao` | `indisponivel` | `timeout`; `mensagem`; `idExecucao?`; `traceId?`; `statusHttp?`) e `EntradaHistorico` (`id`, `usuario`, `pergunta`, `enviadaEm`, `resultado`: sucesso com resposta ou falha). `FalhaApi` **não tem campo de custo**.
- [X] T007 Criar `frontend/src/services/orquestradorApi.ts`, o **único arquivo do frontend com `fetch`** (princípio IV). Exporta uma função `executar(pedido: PerguntaRequest)` que faz `POST /api/orquestrador/executar` (caminho relativo, `Content-Type: application/json`) e aplica as 6 regras de `specs/001-interface-chat-orquestrador/contracts/api-orquestrador.md`, em ordem: (1) temporizador de 180 s (`AbortController` + `setTimeout(180_000)`, limpo ao terminar) → `timeout`; (2) erro de rede → `indisponivel`; (3) HTTP 400 → `validacao`; (4) HTTP ≥ 500 com corpo JSON que tenha `detail` em texto → `execucao` usando o `detail` limitado a 300 caracteres, extraindo `idExecucao=([^;\s]+)` e `traceId=([^;\s]+)` e removendo esse trecho da mensagem; (5) HTTP 200 fora da forma esperada (conferir o tipo dos 11 campos) → `execucao` com a mensagem "A API devolveu uma resposta em formato inesperado."; (6) qualquer outro caso, inclusive 5xx sem corpo → `indisponivel` com "HTTP {status}". Ler o corpo de erro como texto antes de tentar `JSON.parse`. **Sem retry automático.** Lançar `FalhaApi` já categorizada; a tela nunca vê status HTTP.
- [X] T008 Criar `frontend/src/services/orquestradorApi.test.ts` (depende de T007) cobrindo as 6 regras e mais: URL e corpo enviados, corpo de erro vazio, corpo de erro que não é JSON, `detail` com e sem identificadores, `detail` maior que 300 caracteres, timeout com relógio falso (`vi.useFakeTimers`) e **uma só chamada ao `fetch` por execução, mesmo após falha**. O `fetch` é simulado só aqui, para forçar status e falhas.

**Checkpoint**: `npm test` passa nos testes do serviço. Os tipos compilam.

---

## Phase 3: User Story 1 - Perguntar e receber a resposta (Priority: P1) 🎯 MVP

**Goal**: Informar nome e pergunta, enviar, ver "enviando", receber a resposta e saber qual agente respondeu.

**Independent Test**: Com o backend no ar, preencher nome e pergunta, enviar e ver o texto da resposta com o agente que respondeu; tentar enviar vazio e com limites estourados; clicar duas vezes e ver uma só requisição (quickstart, cenários 3, 4, 6 e 7).

### Tests for User Story 1

- [X] T009 [P] [US1] Criar `frontend/src/utils/validacao.test.ts`: nome vazio, só espaços, 120 e 121 caracteres; pergunta vazia, só espaços, 4000 e 4001 caracteres; o texto retornado sai sem espaços nas pontas.
- [X] T010 [P] [US1] Criar `frontend/src/utils/respostaJson.test.ts`: texto comum; objeto e array JSON válidos; texto começando com `{` mas inválido (vira texto comum); `"123"`, `true`, `null` e texto entre aspas (viram texto comum); HTML no texto permanece texto.

### Implementation for User Story 1

- [X] T011 [P] [US1] Criar `frontend/src/utils/validacao.ts` com as regras do `data-model.md`, citadas literalmente: `usuario` é "obrigatório, sem espaços nas pontas, 1 a 120 caracteres"; `pergunta` é "obrigatória, sem espaços nas pontas, 1 a 4000 caracteres". Mensagens: "Informe o nome.", "Informe a pergunta.", "O nome aceita até 120 caracteres.", "A pergunta aceita até 4000 caracteres." A contagem usa o texto sem espaços nas pontas.
- [X] T012 [P] [US1] Criar `frontend/src/utils/respostaJson.ts`: tentar `JSON.parse` só se o texto, sem espaços nas pontas, começar com `{` ou `[`; só objeto ou array contam como JSON; devolver o texto formatado com `JSON.stringify(valor, null, 2)`. Qualquer outra coisa devolve "não é JSON".
- [X] T013 [US1] Criar `frontend/src/components/RespostaConteudo.tsx`: texto comum com `white-space: pre-wrap` e quebra de palavra longa; quando for JSON, um `<details>` **fechado por padrão** com resumo "Resposta em JSON (expandir)" e o conteúdo em `<pre>`. **Nunca** usar `dangerouslySetInnerHTML`; tudo entra como texto (depende de T012).
- [X] T014 [US1] Criar `frontend/src/components/FormularioPergunta.tsx`: campo de nome e campo de pergunta com `<label>` associado, contadores "n/120" e "n/4000", mensagens de erro ligadas por `aria-describedby`, botão que mostra "Enviando…" e fica `disabled` durante o envio. Validar com `validacao.ts` antes de enviar; com erro, nada é enviado (depende de T011).
- [X] T015 [US1] Criar `frontend/src/components/EntradaHistorico.tsx`: cartão com a pergunta enviada, o `agenteExecutado` em destaque, `destino` e `protocolo` em texto menor, e a resposta via `RespostaConteudo` (depende de T013).
- [X] T016 [US1] Criar `frontend/src/components/Historico.tsx`: lista as `EntradaHistorico` em **ordem cronológica** (a mais antiga no alto) e leva a nova entrada à vista ao ser adicionada (depende de T015).
- [X] T017 [US1] Montar `frontend/src/App.tsx`: estado `historico`, `enviando`, `usuario`, `pergunta`. No envio válido: marcar `enviando` **também por um `ref`** para bloquear um segundo Enter ou clique antes de o React atualizar; chamar `executar` de `services/orquestradorApi.ts`; em sucesso, adicionar a entrada, limpar a pergunta e **manter o nome**. Região `aria-live="polite"` com "Enviando pergunta ao orquestrador" e "Resposta recebida de {agente}". Os componentes não importam `fetch` (depende de T014, T016 e T007).
- [X] T018 [US1] Escrever em `frontend/src/App.css` o visual base pedido: fundo claro, texto escuro, destaque azul (botão, foco), fonte do sistema, cartões com borda fina e sombra discreta, foco visível. O responsivo fino fica para T036.
- [X] T019 [US1] Criar `frontend/src/App.test.tsx` com o serviço substituído: envio válido mostra a resposta e o agente; dois cliques rápidos fazem **uma** chamada; campos inválidos não chamam o serviço; o nome continua preenchido e a pergunta é limpa após sucesso; resposta com `<script>` aparece como texto.

**Checkpoint**: 🎯 **MVP.** Integração real funcionando: perguntar e ver a resposta com o agente. Conferir quickstart, cenários 3, 4, 6 e 7. Se o tempo da aula acabar aqui, já existe uma entrega útil.

---

## Phase 4: User Story 2 - Consultar consumo e rastreabilidade (Priority: P2)

**Goal**: Cada resposta mostra tokens, custo do orquestrador, duração, `idExecucao` e `traceId`.

**Independent Test**: Enviar uma pergunta e conferir os sete dados no cartão, com rótulos "do orquestrador" e custo de 6 a 8 casas (quickstart, cenários 3, 4 e 5).

### Tests for User Story 2

- [X] T020 [P] [US2] Criar `frontend/src/utils/formatadores.test.ts` com a tabela de `specs/001-interface-chat-orquestrador/contracts/exibicao.md`: `0.000276` → `USD 0,000276`; `2.76E-4` → `USD 0,000276`; `0.00012345678` → `USD 0,00012346`; `0.1` → `USD 0,100000`; `0` → `USD 0,000000`; `0.000000004` → `USD < 0,00000001`; sem valor → `Custo desconhecido`. Duração: `1400` → `1.400 ms (1,4 s)` e `65200` → `65.200 ms (65,2 s)`.

### Implementation for User Story 2

- [X] T021 [P] [US2] Criar `frontend/src/utils/formatadores.ts` com `formatarCusto`, `formatarDuracao` e `formatarTokens`. Custo: `Intl.NumberFormat('pt-BR')` com **mínimo 6 e máximo 8 casas**, nunca arredondado a 2 casas, **nunca em notação científica**, prefixo "USD", e valor positivo abaixo de 0,00000001 mostrado como "< 0,00000001". Duração: milissegundos com separador de milhar e segundos com até 2 casas.
- [X] T022 [US2] Criar `frontend/src/components/DetalhesExecucao.tsx`: três linhas de tokens ("Tokens de entrada", "Tokens em cache", "Tokens de saída", sob o título "Orquestrador"), "Custo estimado do orquestrador (USD)", duração, `idExecucao` e `traceId` em fonte monoespaçada e selecionável, cada um com botão "Copiar" que copia o valor sem alteração e confirma com texto anunciado a leitores de tela. Quando `destino` for `RH`, mostrar a nota "Não inclui o consumo do Agente RH." **Nunca** usar o rótulo "custo total" (depende de T021).
- [X] T023 [US2] Incluir `DetalhesExecucao` no cartão de sucesso de `frontend/src/components/EntradaHistorico.tsx` (depende de T022).
- [X] T024 [US2] Criar `frontend/src/components/DetalhesExecucao.test.tsx`: os sete dados aparecem; rótulos "do orquestrador"; a nota do RH só aparece com destino `RH`; o botão copiar entrega o valor exato ao `navigator.clipboard`.

**Checkpoint**: Quickstart, cenários 3 a 5 conferidos com a API real.

---

## Phase 5: User Story 3 - Entender e reagir a falhas (Priority: P2)

**Goal**: Cada falha mostra uma mensagem clara; nada é reenviado sozinho; a pergunta continua no campo; o custo aparece como desconhecido.

**Independent Test**: Parar o backend e enviar; depois subir e enviar de novo manualmente (quickstart, cenários 8 e 9).

### Tests for User Story 3

- [X] T025 [P] [US3] Criar `frontend/src/components/MensagemFalha.test.tsx` e estender `frontend/src/App.test.tsx`: uma falha de cada categoria mostra o título e a mensagem certos; `idExecucao` e `traceId` aparecem quando existem e não aparecem quando faltam; "Custo: desconhecido" em toda falha; a pergunta continua no campo; **zero chamada automática** após a falha, mesmo avançando o relógio.

### Implementation for User Story 3

- [X] T026 [US3] Criar `frontend/src/components/MensagemFalha.tsx`: cartão com `role="alert"`, título por categoria ("Dado inválido", "Falha na execução", "API indisponível", "Tempo esgotado"), a mensagem da `FalhaApi`, `idExecucao` e `traceId` com botão "Copiar" quando existirem, e a linha fixa "Custo: desconhecido". Mensagem renderizada só como texto; sem stack trace, sem corpo bruto.
- [X] T027 [US3] Em `frontend/src/components/EntradaHistorico.tsx`, renderizar `MensagemFalha` quando o resultado for falha. Em `frontend/src/App.tsx`, no `catch`: adicionar a entrada de falha, liberar o envio (inclusive o `ref`) e **manter** a pergunta no campo. **Nenhum retry automático.**

**Checkpoint**: Quickstart, cenários 8 e 9. Confirmar o que o proxy devolve com o backend parado e ajustar o mapeamento se divergir (pendência R6 do `research.md`).

---

## Phase 6: User Story 4 - Começar por perguntas de exemplo (Priority: P3)

**Goal**: Tela inicial com três exemplos que preenchem o campo, sem enviar.

**Independent Test**: Abrir a página sem histórico, clicar num exemplo e ver o texto no campo, sem requisição (quickstart, cenários 1 e 2).

- [X] T028 [P] [US4] Criar `frontend/src/components/ExemplosPerguntas.tsx` com exatamente estas três perguntas: "Olá! O que você pode fazer?", "Explique o que é uma API REST." e "Como solicito férias?", como botões acessíveis por teclado.
- [X] T029 [US4] Em `frontend/src/App.tsx`, mostrar `ExemplosPerguntas` somente com o histórico vazio; clicar num exemplo **só preenche** o campo de pergunta, sem enviar (depende de T028).
- [X] T030 [US4] Estender `frontend/src/App.test.tsx`: os três exemplos aparecem com o histórico vazio; clicar preenche o campo e não chama o serviço; com uma entrada no histórico, os exemplos somem.

**Checkpoint**: Quickstart, cenários 1 e 2.

---

## Phase 7: User Story 5 - Histórico visual e limpeza (Priority: P3)

**Goal**: Aviso de que o histórico é só visual e botão para limpar.

**Independent Test**: Enviar duas perguntas, limpar e ver a tela inicial; recarregar e ver o histórico vazio (quickstart, cenários 10 e 11).

- [X] T031 [P] [US5] Criar `frontend/src/components/AvisoHistorico.tsx` com o texto fixo de `specs/001-interface-chat-orquestrador/contracts/exibicao.md`: "O histórico abaixo é só um registro visual desta página. Cada pergunta é enviada de forma independente: o agente não lembra das anteriores. Ao recarregar a página, ele some."
- [X] T032 [US5] Em `frontend/src/components/Historico.tsx`, mostrar o `AvisoHistorico` e o botão "Limpar histórico", **desabilitado durante um envio**. Em `frontend/src/App.tsx`, limpar o histórico e restaurar a tela inicial com os exemplos. **Não gravar nada** em `localStorage`, `sessionStorage` nem cookie (depende de T031).
- [X] T033 [US5] Estender `frontend/src/App.test.tsx`: limpar remove todas as entradas e traz os exemplos de volta; o botão fica desabilitado durante o envio; nenhuma escrita em `localStorage` nem em `sessionStorage` durante o fluxo.

**Checkpoint**: Quickstart, cenários 10 e 11.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Layout responsivo, acessibilidade, build e aceite final.

- [X] T034 Revisar `frontend/src/App.tsx` e os componentes quanto ao uso de `fetch`: confirmar com busca que só `frontend/src/services/orquestradorApi.ts` o utiliza (princípio IV) e que não há `dangerouslySetInnerHTML` em lugar nenhum de `frontend/src/`.
- [X] T035 Revisar todos os textos da interface (`frontend/src/`): nenhum sugere memória do agente (SC-008), nenhum chama o custo de "total" (FR-011), e todos estão em português do Brasil.
- [ ] T036 Ajustar `frontend/src/App.css` para o layout responsivo: sem rolagem horizontal de 320 px até desktop, largura máxima do conteúdo, alvos de toque de pelo menos 44 px, contraste mínimo AA, `<pre>` do JSON com rolagem própria, palavras longas quebrando. Aplica-se a todas as histórias. **(CSS escrito; falta conferir visualmente em 320 px e desktop)**
- [ ] T037 Verificar a acessibilidade percorrendo a tela só com Tab: ordem lógica, foco sempre visível, `label` em todos os campos, `aria-live` para "enviando" e "resposta recebida", `role="alert"` nas falhas. **(pendente: percurso por teclado ainda não conferido no navegador)**
- [X] T038 Conferir que nenhuma chave, segredo nem arquivo `.env` existe em `frontend/` e que nenhuma variável de ambiente de build foi criada (princípio V).
- [X] T039 Rodar `npm test` em `frontend/` e registrar a saída. Se algo falhar, dizer o que falhou.
- [X] T040 Rodar `npm run build` em `frontend/` (verificação de tipos e pacote) e registrar a saída. Não publicar o resultado.
- [ ] T041 Rodar todos os cenários de `specs/001-interface-chat-orquestrador/quickstart.md` (1 a 13) com o backend real. Registrar o que o proxy devolve com o backend parado e como `custoOrquestradorUsd` chega no JSON (pendências R6 e R8 do `research.md`). Não consumir mais chamadas ao modelo do que o necessário. **(parcial: proxy, GET /status e POST inválido (400) conferidos por curl; cenários com pergunta real ficam para a demonstração manual)**
- [X] T042 Conferir os critérios SC-001 a SC-009 da `spec.md` e `git status`: só `frontend/` e `specs/` aparecem como alterações, o código Java não mudou, e **nenhum commit** foi criado.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: T001 (aprovação) antes de instalar as dependências de teste; o restante começa de imediato.
- **Foundational (Fase 2)**: depende da Fase 1. Bloqueia todas as histórias.
- **US1 (Fase 3)**: depende da Fase 2. É o MVP.
- **US2 e US3 (Fases 4 e 5)**: dependem da US1 (precisam do cartão e do estado do `App`), mas não uma da outra.
- **US4 e US5 (Fases 6 e 7)**: dependem da US1; independentes entre si e das demais.
- **Polish (Fase 8)**: depende das histórias desejadas.

### Dentro de cada história

- Funções puras (`utils`) antes dos componentes que as usam.
- Componentes antes da montagem em `App.tsx`.
- Os testes são escritos junto com a implementação; os de cada história rodam no checkpoint dela.

### Observação sobre arquivos compartilhados

`App.tsx`, `App.test.tsx`, `EntradaHistorico.tsx` e `Historico.tsx` são editados em mais de uma história. Por isso essas tarefas **não** têm `[P]` entre si e seguem a ordem das fases.

---

## Parallel Opportunities

```text
# US1, antes dos componentes:
T009 validacao.test.ts   |  T010 respostaJson.test.ts
T011 validacao.ts        |  T012 respostaJson.ts

# US2:
T020 formatadores.test.ts  |  T021 formatadores.ts

# US4 e US5 podem andar juntas depois da US1:
T028 ExemplosPerguntas.tsx  |  T031 AvisoHistorico.tsx
```

---

## Implementation Strategy

### MVP primeiro (integração funcional dentro da aula)

1. Fase 1 (Setup) e Fase 2 (Fundação).
2. Fase 3 (US1) e **parar para validar com a API real** (cenários 3, 4, 6 e 7).
3. Se houver tempo, seguir a ordem de prioridade: US2 → US3 → US4 → US5 → Polish.

### Se o tempo apertar

A ordem das fases já é a de prioridade da spec. O que ficar de fora é cortado do fim (US5, depois US4), e nunca a Fase 8, em especial T039 a T042, porque dizer o que foi e o que não foi verificado faz parte da entrega. Nenhuma tarefa acrescenta funcionalidade fora da spec.

### Pontos de verificação com a API real

| Depois de | Cenários do quickstart |
|---|---|
| T005 | proxy: `GET /api/orquestrador/status` |
| T019 | 3, 4, 6, 7 |
| T024 | 3, 4, 5 |
| T027 | 8, 9 |
| T030 | 1, 2 |
| T033 | 10, 11 |
| T041 | 1 a 13 |

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente.
- [Story] liga a tarefa à história da spec.
- Versões das dependências são fixadas na instalação, conferidas com `npm view`.
- Sem commit e sem publicação em nenhuma tarefa.
