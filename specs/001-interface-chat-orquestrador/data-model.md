# Data Model: Interface web do Orquestrador AI

Tudo existe só em memória, na página aberta (FR-023). Os nomes de campo da API são os do
backend; os nomes internos do frontend ficam em português, conforme a regra do projeto.

## PerguntaRequest (enviada à API)

| Campo | Tipo | Regra |
|---|---|---|
| `usuario` | texto | obrigatório, sem espaços nas pontas, 1 a 120 caracteres |
| `pergunta` | texto | obrigatória, sem espaços nas pontas, 1 a 4000 caracteres |

O texto é enviado sem espaços nas pontas. A contagem usa o texto sem espaços nas pontas.

## OrquestracaoResponse (recebida em sucesso)

| Campo | Tipo | Observação |
|---|---|---|
| `idExecucao` | texto | UUID |
| `traceId` | texto | identificador do trace |
| `agenteExecutado` | texto | "Orquestrador AI" ou "Agente RH AI" |
| `protocolo` | texto | "RESPOSTA_DIRETA" ou "A2A" |
| `destino` | texto | "DIRETO" ou "RH" |
| `resposta` | texto | pode ser texto comum ou JSON em texto |
| `tokensEntradaOrquestrador` | inteiro | só a decisão do orquestrador |
| `tokensCacheOrquestrador` | inteiro | idem |
| `tokensSaidaOrquestrador` | inteiro | idem |
| `custoOrquestradorUsd` | número | custo da decisão do orquestrador, não o total |
| `duracaoMs` | inteiro | milissegundos |

O serviço confere a forma da resposta (tipos dos 11 campos) antes de entregá-la à tela. Resposta
fora da forma vira falha de categoria `execucao` com mensagem genérica.

## FalhaApi (resultado de erro)

| Campo | Tipo | Observação |
|---|---|---|
| `categoria` | `validacao` \| `execucao` \| `indisponivel` \| `timeout` | as quatro da spec |
| `mensagem` | texto | em português, pronta para exibir |
| `idExecucao` | texto, opcional | só se extraído do `detail` |
| `traceId` | texto, opcional | idem |
| `statusHttp` | inteiro, opcional | só para a mensagem de `indisponivel` |

O custo de uma falha é sempre "desconhecido": a entidade não tem campo de custo.

## EntradaHistorico (item da lista)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | texto | gerado na tela, só para a chave de lista |
| `usuario` | texto | como foi enviado |
| `pergunta` | texto | como foi enviada |
| `enviadaEm` | data/hora | para exibir a hora local |
| `resultado` | `{ tipo: 'sucesso', resposta }` ou `{ tipo: 'falha', falha }` | |

## Estado da página (`App`)

| Estado | Tipo | Regra |
|---|---|---|
| `historico` | lista de `EntradaHistorico` | ordem cronológica; vazio mostra exemplos |
| `enviando` | booleano | bloqueia envio e o botão "Limpar histórico" |
| `usuario` | texto | permanece entre envios |
| `pergunta` | texto | limpa em sucesso, mantida em falha |
| `errosDeCampo` | por campo | só validação local |

## Transições

```text
ocioso --enviar (válido)--> enviando --sucesso--> ocioso (+ entrada de sucesso, pergunta limpa)
ocioso --enviar (inválido)--> ocioso (erros nos campos, sem chamada)
enviando --falha/timeout--> ocioso (+ entrada de falha, pergunta mantida)
ocioso --limpar--> ocioso (histórico vazio, exemplos de volta)
```

`enviando` não aceita novo envio nem limpeza. Não há transição automática de falha para envio.
