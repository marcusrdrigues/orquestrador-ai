# Research: Interface web do Orquestrador AI

Sem `NEEDS CLARIFICATION` pendente no plano. As decisões abaixo registram o que foi conferido e o
que ainda depende de verificação em execução.

## R1. Nomes do contrato (conferido no código)

- **Decision**: usar os nomes exatos de `OrquestracaoResponse` e `PerguntaRequest`.
- **Evidência**: `dtos/OrquestracaoResponse.java` tem os 11 campos `idExecucao`, `traceId`,
  `agenteExecutado`, `protocolo`, `destino`, `resposta`, `tokensEntradaOrquestrador`,
  `tokensCacheOrquestrador`, `tokensSaidaOrquestrador`, `custoOrquestradorUsd` (BigDecimal) e
  `duracaoMs`. `dtos/PerguntaRequest.java` tem `usuario` (≤120) e `pergunta` (≤4000).
- **Resultado**: o exemplo que você mandou bate com o código campo a campo. Nenhuma divergência.

## R2. Proxy do Vite

- **Decision**: `server.proxy` com a chave `'/api'` e `target: 'http://localhost:8083'`, sem
  `rewrite`, sem `changeOrigin`.
- **Rationale**: a documentação do Vite mostra que o prefixo só é removido quando há `rewrite`.
  Sem ele, `/api/orquestrador/executar` chega ao backend com o mesmo caminho. Do ponto de vista do
  navegador a chamada é da mesma origem (`localhost:5173`), então não há CORS nem preflight.
- **Alternatives**: CORS no Spring (muda o backend, vai contra o princípio X); URL absoluta
  `http://localhost:8083` no código (exige CORS e espalha configuração).
- **Limite**: o proxy existe só no servidor de desenvolvimento. `vite preview` e hospedagem
  estática precisariam de configuração própria, e publicação está fora do escopo.

## R3. Porta fixa

- **Decision**: `server.port: 5173` com `strictPort: true`.
- **Rationale**: a documentação diz que, sem `strictPort`, o Vite escolhe a próxima porta livre
  em silêncio. Com ele, falha se 5173 estiver ocupada, e o comportamento fica previsível.

## R4. Versão do Node

- **Decision**: manter o Node v24.22.1 da máquina.
- **Rationale**: a documentação do Vite indica `^20.19.0 || >=22.12.0` para Vite 7 e 8; o 24
  atende.

## R5. Timeout de 180 s

- **Decision**: `AbortController` + `setTimeout(180_000)`, limpando o temporizador ao terminar.
- **Rationale**: o backend pode levar até cerca de 150 s no pior caso: 60 s de leitura no modelo
  de decisão (`AgenteDecisorService`) mais 90 s do Agente RH (`app.agents.rh.timeout-seconds`).
  Com 180 s, a tela não cancela uma execução que o servidor ainda completaria.
- **Efeito colateral a saber**: ao abortar, o navegador desiste, mas o backend continua a
  execução e grava a auditoria. A tela não deve dizer que a execução foi cancelada.

## R6. Backend fora do ar visto pelo proxy (NÃO verificado)

- **Hipótese**: com o backend parado, o proxy do Vite responde com erro 5xx **sem corpo JSON**.
  Já a falha de execução do backend (502/503) vem com ProblemDetail em JSON.
- **Decision**: classificar pela presença de corpo JSON com `detail`, e não só pelo status. Erro
  5xx sem esse corpo vira "API indisponível".
- **A verificar** no quickstart (cenário com o backend parado).

## R7. Formato de erro 400 (NÃO verificado)

- **Fato**: o código não trata `MethodArgumentNotValidException`, e não há
  `spring.mvc.problemdetails` na configuração.
- **Decision**: qualquer 400 vira "dado inválido" com texto próprio da tela. O corpo do 400 não é
  exibido, porque pode trazer detalhe técnico do framework.

## R8. Número do custo no JSON (NÃO verificado)

- **Risco**: `BigDecimal` pode sair no JSON em notação científica (por exemplo `2.76E-4`).
  É JSON válido e o `JSON.parse` do navegador entende, então o tipo no frontend é `number`.
- **Decision**: formatar sempre com `Intl.NumberFormat('pt-BR')` (mínimo 6, máximo 8 casas), que
  nunca produz notação científica. Teste cobre `2.76E-4`.

## R9. Detecção de JSON dentro da resposta

- **Decision**: tentar `JSON.parse` só se o texto, sem espaços nas pontas, começar com `{` ou `[`.
  Só objeto ou array vira bloco expansível. Números, `true`, `null` e textos entre aspas continuam
  texto comum.
- **Rationale**: `"123"` e `"true"` são JSON válido, mas formatá-los como bloco confunde.
  O bloco usa `<details>` nativo, que já é acessível por teclado.
- **Alternatives**: biblioteca de visualização de JSON (dependência desnecessária).

## R10. Exibir a mensagem `detail` do backend

- **Decision**: em falha de execução (5xx com ProblemDetail), mostrar o `detail`, com o trecho
  `idExecucao=...; traceId=...` retirado do texto e exibido como campos próprios.
- **Rationale**: o `detail` é montado pelo próprio backend e foi feito para não vazar detalhe
  interno (`OrquestradorService`). Mesmo assim, é limitado a 300 caracteres e renderizado só como
  texto.
- **Extração**: padrões `idExecucao=([^;\s]+)` e `traceId=([^;\s]+)`. Se não casar, os campos
  simplesmente não aparecem.

## R11. Ferramentas de teste

- **Decision**: Vitest + React Testing Library + user-event + jsdom.
- **Rationale**: o Vitest reaproveita a configuração do Vite, sem Babel ou Jest à parte.
- **Pendência**: aprovação das dependências antes de instalar; licença e manutenção por conferir.
