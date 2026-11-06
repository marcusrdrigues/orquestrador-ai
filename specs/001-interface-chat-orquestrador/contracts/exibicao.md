# Contrato de exibição

Regras de apresentação, testáveis, para a interface. Referência: [spec.md](../spec.md).

## Custo (FR-010, FR-011, FR-012, FR-018)

| Entrada | Saída |
|---|---|
| `0.000276` | `USD 0,000276` |
| `2.76E-4` | `USD 0,000276` |
| `0.00012345678` | `USD 0,00012346` |
| `0.1` | `USD 0,100000` |
| `0` (sucesso) | `USD 0,000000` |
| `0.000000004` | `USD < 0,00000001` |
| sem valor (falha) | `Custo desconhecido` |

- Formato: `pt-BR`, mínimo 6 e máximo 8 casas, sem agrupamento de milhar desnecessário.
- Rótulo: "Custo estimado do orquestrador (USD)". Abaixo, uma nota curta:
  "Não inclui o consumo do Agente RH." Esse aviso aparece quando o destino é RH.
- Nunca o rótulo "custo total".

## Tokens

Três linhas rotuladas: "Tokens de entrada", "Tokens em cache", "Tokens de saída", cada uma
seguida de "(orquestrador)" ou sob um título "Orquestrador". Números com separador de milhar
`pt-BR`.

## Duração (FR-013)

`1400` ms → `1.400 ms (1,4 s)`. Segundos com até 2 casas decimais. `65200` → `65.200 ms (65,2 s)`.

## Agente (FR-009)

Mostra `agenteExecutado` em destaque ("Orquestrador AI" ou "Agente RH AI") e, em texto menor,
o `destino` e o `protocolo`.

## Identificadores (FR-014)

`idExecucao` e `traceId` em fonte monoespaçada, selecionáveis, cada um com botão "Copiar".
O botão copia o valor sem alteração e confirma com texto na própria tela (anunciado a leitores
de tela). Se a cópia não for permitida pelo navegador, o valor continua selecionável.

## Resposta (FR-008)

1. Texto comum: exibido com `white-space: pre-wrap`, quebra de palavra longa, sem HTML.
2. Texto que, sem espaços nas pontas, começa com `{` ou `[` e é JSON válido: bloco
   `<details>` fechado por padrão, com resumo "Resposta em JSON (expandir)" e conteúdo
   `JSON.stringify(valor, null, 2)` dentro de `<pre>`.
3. Texto que começa com `{` ou `[` mas não é JSON válido: tratado como texto comum (item 1).
4. Texto que é JSON de valor simples (número, `true`, `null`, texto entre aspas): texto comum.

## Falhas (FR-015 a FR-019)

- Cartão com `role="alert"`, título por categoria (dado inválido, falha na execução, API
  indisponível, tempo esgotado) e a mensagem do contrato de API.
- `idExecucao` e `traceId` aparecem quando extraídos, com o mesmo botão "Copiar".
- Linha fixa: "Custo: desconhecido".
- Nenhum botão de "tentar de novo" automático; a pergunta fica no campo.

## Validação local (FR-001 a FR-004)

- Mensagens junto ao campo, ligadas por `aria-describedby`, em português: "Informe o nome.",
  "Informe a pergunta.", "O nome aceita até 120 caracteres.", "A pergunta aceita até 4000
  caracteres."
- Contadores "n/120" e "n/4000" visíveis.
- Nada é enviado enquanto houver erro.

## Estados e anúncios (FR-006, FR-026)

- Enviando: botão desabilitado com texto "Enviando…", indicador visível e região
  `aria-live="polite"` com "Enviando pergunta ao orquestrador". Botão "Limpar histórico"
  desabilitado.
- Resposta recebida: anúncio "Resposta recebida de {agente}".
- Falha: o `role="alert"` do cartão anuncia.

## Avisos fixos (FR-025)

Texto no topo do histórico: "O histórico abaixo é só um registro visual desta página. Cada
pergunta é enviada de forma independente: o agente não lembra das anteriores. Ao recarregar a
página, ele some."

## Visual

Fundo claro, texto escuro, destaque azul (botões, links, foco), cartões com borda fina e sombra
discreta, fonte do sistema, contraste mínimo AA, alvo de toque de pelo menos 44 px, layout de
uma coluna que se mantém legível de 320 px até desktop (largura máxima do conteúdo limitada).
