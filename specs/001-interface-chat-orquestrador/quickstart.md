# Quickstart: validar a interface de ponta a ponta

Guia de execução e validação. Não contém código da implementação. Contratos em
[contracts/](contracts/) e entidades em [data-model.md](data-model.md).

## Pré-requisitos

- Node `^20.19.0 || >=22.12.0` (a máquina tem v24.22.1).
- Backend em execução em `http://localhost:8083` (banco PostgreSQL de auditoria no ar e a variável
  `OPENAI_API_KEY` definida no ambiente do backend; **nunca** no frontend).
- Para o cenário de RH: Agente RH em `http://localhost:8082`.
- Porta 5173 livre.

## Comandos (a partir da pasta `frontend/`)

```text
npm install       # instala as dependências (após aprovação das de teste)
npm run dev       # sobe em http://localhost:5173 (strictPort)
npm test          # testes automatizados, sem chamar a API real
npm run build     # verifica tipos e gera o pacote (não publica)
```

## Cenários com a API real

| # | Cenário | Passos | Resultado esperado | Spec |
|---|---|---|---|---|
| 1 | Tela inicial | Abrir `http://localhost:5173` | 3 exemplos visíveis, histórico vazio, aviso de que não há memória do agente | US4, FR-020, FR-025 |
| 2 | Exemplo não envia | Clicar em "Explique o que é uma API REST." | Texto vai ao campo; nenhuma requisição na aba Rede | FR-021 |
| 3 | Resposta direta | Nome + exemplo 2 + Enviar | Indicador "Enviando…"; resposta com **Orquestrador AI**; 3 tokens, custo, duração e ids | US1, US2 |
| 4 | Resposta do RH | Nome + "Como solicito férias?" | **Agente RH AI**, destino RH, nota "não inclui o consumo do Agente RH" | US1, FR-011 |
| 5 | Custo pequeno | Observar o custo dos cenários 3 e 4 | De 6 a 8 casas, em USD, sem notação científica | FR-012 |
| 6 | Envio duplicado | Clicar duas vezes / Enter repetido durante o envio | Uma única requisição `POST /api/orquestrador/executar` na aba Rede | FR-006 |
| 7 | Validação local | Enviar vazio; nome com 121 caracteres; pergunta com 4001 | Mensagens junto aos campos; nenhuma requisição | FR-001 a FR-004 |
| 8 | Backend parado | Parar a API e enviar | Cartão "API indisponível", pergunta mantida, custo desconhecido, nenhum reenvio | US3, FR-018, FR-019 |
| 9 | Falha de execução | Parar o Agente RH e perguntar sobre férias | Cartão "Falha na execução" com mensagem do `detail`, `idExecucao` e `traceId` | US3, FR-017 |
| 10 | Histórico e limpeza | Enviar 2 perguntas; clicar "Limpar histórico" | Duas entradas em ordem cronológica; depois, tela inicial com exemplos | US5 |
| 11 | Recarregar | Recarregar a página com histórico | Histórico vazio | FR-023 |
| 12 | Teclado e 320 px | Percorrer só com Tab; reduzir a janela a 320 px | Tudo operável; sem rolagem horizontal | FR-026, FR-027 |
| 13 | Prefixo `/api` | Aba Rede: ver a URL da requisição | `http://localhost:5173/api/orquestrador/executar` e status 200, sem erro de CORS | Integração |

## Verificar o que ainda não foi comprovado

- No cenário 8, confirmar qual status e corpo o proxy devolve com o backend parado e se a
  mensagem cai em "API indisponível". Ajustar o mapeamento do contrato se for diferente.
- No cenário 3, conferir na aba Rede como `custoOrquestradorUsd` vem no JSON (número comum ou
  notação científica).
- Provocar um 400 real (por exemplo, enviando direto à API um corpo vazio) para ver o formato,
  apenas por conhecimento: a tela não o exibe.

## Timeout de 180 s

Não dá para esperar 180 s à mão com facilidade. Esse caso é coberto por teste automatizado com
relógio falso. Para ver na prática, reduza temporariamente o limite durante a validação e depois
volte para 180 s.

## Critério de pronto

Cenários 1 a 13 conferidos, `npm test` sem falhas, `npm run build` sem erro de tipos e nenhum
arquivo fora de `frontend/` e `specs/` alterado. Sem commit, sem publicação.
