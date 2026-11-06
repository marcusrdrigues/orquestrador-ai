# Contrato consumido: API do orquestrador

Contrato **existente**, conferido no código; o frontend não o altera. Campos e tipos em
[data-model.md](../data-model.md).

## Requisição

```http
POST /api/orquestrador/executar
Content-Type: application/json

{ "usuario": "Sergio Mendes", "pergunta": "Como solicito férias?" }
```

- Do navegador, o caminho é relativo (`/api/...`). O proxy do Vite encaminha para
  `http://localhost:8083`, mantendo o prefixo `/api`.
- Sem cabeçalho de autenticação: a API não tem autenticação.
- Uma chamada por ação da pessoa. Sem retry automático.
- Tempo limite de 180 s, controlado no cliente.

## Resposta de sucesso (HTTP 200)

Corpo com os 11 campos de `OrquestracaoResponse`. Exemplo:

```json
{
  "idExecucao": "uuid",
  "traceId": "identificador",
  "agenteExecutado": "Agente RH AI",
  "protocolo": "A2A",
  "destino": "RH",
  "resposta": "Texto retornado",
  "tokensEntradaOrquestrador": 450,
  "tokensCacheOrquestrador": 0,
  "tokensSaidaOrquestrador": 60,
  "custoOrquestradorUsd": 0.000276,
  "duracaoMs": 1400
}
```

## Mapeamento de erros (feito em `orquestradorApi.ts`)

A regra é avaliada de cima para baixo; a primeira que casar vale.

| # | Condição | Categoria | Mensagem exibida | `detail` usado? |
|---|---|---|---|---|
| 1 | Temporizador de 180 s estourou | `timeout` | "A API não respondeu em 3 minutos. A execução pode ter terminado no servidor. Envie de novo se quiser." | não |
| 2 | `fetch` lança erro de rede (sem resposta) | `indisponivel` | "Não foi possível falar com a API. Confira se o backend está no ar." | não |
| 3 | HTTP 400 (com ou sem corpo) | `validacao` | "A API recusou os dados enviados. Confira o nome e a pergunta." | não |
| 4 | HTTP ≥ 500 com corpo JSON que tenha `detail` em texto | `execucao` | o `detail`, sem o trecho de identificadores | sim |
| 5 | HTTP 200 com corpo fora da forma esperada | `execucao` | "A API devolveu uma resposta em formato inesperado." | não |
| 6 | Qualquer outro status ou corpo sem JSON (inclui 5xx sem corpo) | `indisponivel` | "A API não está disponível agora (HTTP {status})." | não |

Regras do corpo de erro:

- O corpo é lido como texto e só depois tentado como JSON; corpo vazio ou não-JSON não quebra a
  tela (item 6).
- Do `detail` do item 4, extraem-se `idExecucao=` e `traceId=` e o restante é a mensagem,
  limitada a 300 caracteres.
- Nenhum outro campo do corpo de erro é exibido (nem `type`, `instance`, nem stack).
- A mensagem de erro é sempre mostrada como texto.

## Pontos ainda não verificados com a API em execução

1. Que o proxy responda 5xx sem corpo JSON quando o backend está parado (cai no item 6 de
   qualquer forma, mas a mensagem esperada é a do item 6).
2. O formato do corpo do 400 (irrelevante para a tela, que não o exibe).
3. A forma numérica do custo no JSON (a tela aceita número comum e notação científica).
