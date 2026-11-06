# Feature Specification: Interface web do Orquestrador AI

**Feature Branch**: `001-interface-chat-orquestrador` (nenhuma branch criada; o trabalho segue na branch atual e não há commit nesta atividade)

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Criar uma interface web para conversar com a API do orquestrador de agentes de IA: informar usuário e pergunta, ver a resposta, identificar o agente, consultar tokens, custo, duração, idExecucao e traceId, manter histórico visual só enquanto a página estiver aberta e poder limpá-lo. Estados: tela inicial com exemplos, envio em andamento, resposta recebida, erro de validação, API indisponível ou timeout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perguntar e receber a resposta (Priority: P1)

A pessoa informa o seu nome, digita uma pergunta e a envia ao orquestrador. Enquanto espera, vê que o envio está em andamento e não consegue enviar de novo. Ao chegar, a resposta aparece na tela junto com a indicação de quem respondeu: o Orquestrador AI ou o Agente RH.

**Why this priority**: É o objetivo da interface. Sem esse fluxo não há produto; com só ele já existe um MVP utilizável.

**Independent Test**: Com o backend em execução, preencher nome e pergunta, enviar e conferir que a resposta e o nome do agente que respondeu aparecem na tela.

**Acceptance Scenarios**:

1. **Dado** nome e pergunta válidos, **Quando** a pessoa envia, **Então** a tela mostra o estado "enviando", bloqueia novo envio e, ao receber a resposta, exibe o texto da resposta e o agente que respondeu.
2. **Dado** uma pergunta de assunto geral (ex.: "Explique o que é uma API REST."), **Quando** a resposta chega, **Então** ela é identificada como do Orquestrador AI.
3. **Dado** uma pergunta de assunto de RH (ex.: "Como solicito férias?"), **Quando** a resposta chega, **Então** ela é identificada como do Agente RH.
4. **Dado** nome ou pergunta vazios (ou só com espaços), **Quando** a pessoa tenta enviar, **Então** nada é enviado e a tela indica qual campo precisa ser preenchido.
5. **Dado** nome com mais de 120 caracteres ou pergunta com mais de 4000, **Quando** a pessoa tenta enviar, **Então** nada é enviado e a tela indica o limite excedido.
6. **Dado** um envio em andamento, **Quando** a pessoa tenta enviar de novo (clique repetido ou tecla Enter), **Então** nenhuma segunda chamada é feita.

---

### User Story 2 - Consultar consumo e rastreabilidade de cada resposta (Priority: P2)

Para cada resposta, a pessoa vê tokens, custo estimado em USD, duração, `idExecucao` e `traceId`, para entender o que a execução consumiu e para citar a execução ao pedir suporte.

**Why this priority**: Dá transparência de custo e rastreabilidade, mas depende de existir uma resposta (história 1).

**Independent Test**: Enviar uma pergunta e conferir, no cartão da resposta, os sete dados abaixo, com rótulos que dizem o que cada um mede.

**Acceptance Scenarios**:

1. **Dado** uma resposta recebida, **Quando** a pessoa a observa, **Então** vê os tokens de entrada, de cache e de saída, o custo, a duração e os identificadores `idExecucao` e `traceId`, sem sair da tela.
2. **Dado** uma resposta cujo custo é uma fração de centavo (ex.: 0,000123 USD), **Quando** ela é exibida, **Então** o custo mostra esse valor com precisão suficiente para distingui-lo de zero.
3. **Dado** uma resposta do Agente RH, **Quando** o custo e os tokens são exibidos, **Então** estão rotulados como do orquestrador, e a tela não os apresenta como custo total dos agentes.
4. **Dado** uma resposta, **Quando** a pessoa quer citar a execução, **Então** consegue copiar o `idExecucao` e o `traceId` exatamente como foram recebidos.

---

### User Story 3 - Entender e reagir a falhas (Priority: P2)

Quando algo dá errado, a pessoa vê uma mensagem clara que diz o que aconteceu: dado inválido, falha na execução, API indisponível ou tempo esgotado. A pergunta não se perde e nada é reenviado sem ação dela.

**Why this priority**: Falhas acontecem (modelo, agente RH, banco, rede). Sem tratamento, a tela parece travada.

**Independent Test**: Enviar com o backend parado e conferir a mensagem de indisponibilidade; depois subir o backend, enviar de novo manualmente e conferir que só então a chamada acontece.

**Acceptance Scenarios**:

1. **Dado** que a API está fora do ar ou inalcançável, **Quando** a pessoa envia, **Então** a tela informa indisponibilidade, libera o envio e mantém a pergunta digitada.
2. **Dado** que a API não responde dentro do tempo limite, **Quando** o tempo esgota, **Então** a tela informa o tempo esgotado, de forma distinguível da indisponibilidade, e libera o envio.
3. **Dado** que a API recusa a entrada por validação, **Quando** a resposta de erro chega, **Então** a tela mostra uma mensagem de dado inválido, sem exibir texto técnico bruto do servidor.
4. **Dado** que a execução falhou no servidor e a mensagem de erro traz `idExecucao` e `traceId`, **Quando** o erro é exibido, **Então** a tela mostra esses identificadores para suporte.
5. **Dado** qualquer falha, **Quando** a tela exibe o resultado, **Então** o custo aparece como "desconhecido" e nunca como zero.
6. **Dado** qualquer falha, **Quando** o tempo passa, **Então** a pergunta não é reenviada automaticamente; só um novo clique da pessoa dispara outra chamada.

---

### User Story 4 - Começar por perguntas de exemplo (Priority: P3)

Na tela inicial, ainda sem histórico, a pessoa vê três perguntas de exemplo e pode usar uma delas como ponto de partida:

1. Olá! O que você pode fazer?
2. Explique o que é uma API REST.
3. Como solicito férias?

**Why this priority**: Facilita o primeiro uso e a demonstração, mas a tela funciona sem isso.

**Independent Test**: Abrir a página sem histórico, escolher um exemplo e conferir que o texto vai para o campo de pergunta.

**Acceptance Scenarios**:

1. **Dado** a página recém-aberta, **Quando** ela carrega, **Então** exibe as três perguntas de exemplo.
2. **Dado** os exemplos visíveis, **Quando** a pessoa escolhe um, **Então** o texto é colocado no campo de pergunta e **nada é enviado** até ela confirmar o envio.
3. **Dado** que já existe ao menos uma entrada no histórico, **Quando** a tela é exibida, **Então** a área de exemplos inicial não ocupa o lugar do histórico.

---

### User Story 5 - Histórico visual e limpeza (Priority: P3)

As perguntas e respostas da sessão ficam listadas na tela em ordem cronológica (a mais antiga no alto, a mais recente embaixo), enquanto a página estiver aberta. A pessoa pode limpar tudo.

**Why this priority**: Conveniência para comparar respostas durante a sessão; não altera o funcionamento do envio.

**Independent Test**: Enviar duas perguntas, conferir as duas entradas, limpar e conferir que a tela volta ao estado inicial; recarregar a página e conferir que nada volta.

**Acceptance Scenarios**:

1. **Dado** perguntas já respondidas, **Quando** a pessoa envia uma nova, **Então** as anteriores continuam visíveis com seus dados.
2. **Dado** um histórico com entradas, **Quando** a pessoa aciona "Limpar histórico", **Então** todas as entradas somem e a tela inicial com exemplos volta.
3. **Dado** um histórico com entradas, **Quando** a página é recarregada ou fechada e reaberta, **Então** o histórico não reaparece.
4. **Dado** o histórico visível, **Quando** a tela o apresenta, **Então** ela deixa claro que é só um registro visual e que cada pergunta é enviada de forma independente, sem memória da conversa pelo agente.
5. **Dado** um envio em andamento, **Quando** a pessoa olha o botão de limpar, **Então** ele está indisponível até o envio terminar.

---

### Edge Cases

- Nome ou pergunta só com espaços em branco: tratados como vazios.
- Pergunta exatamente com 4000 caracteres e nome com 120: aceitos; com um caractere a mais: recusados.
- Texto da resposta com marcação (por exemplo, `<script>` ou HTML): exibido como texto, nunca interpretado.
- Resposta muito longa ou com quebras de linha: legível, sem quebrar o layout e preservando as quebras.
- Tecla Enter no campo de pergunta: não deve disparar envio duplicado nem enviar acidentalmente durante um envio em andamento.
- Resposta de erro sem corpo reconhecível (por exemplo, falha de proxy ou rede): tratada como indisponibilidade, sem exibir conteúdo bruto.
- Mensagem de erro sem `idExecucao`/`traceId` identificáveis: a tela mostra o erro sem esses campos, sem inventar valores.
- Custo recebido como zero em uma resposta bem-sucedida: exibido como zero, diferente de "desconhecido".
- Pessoa digita o mesmo nome de usuário em várias perguntas: o campo de nome continua preenchido entre envios na mesma sessão da página.
- Pergunta com dado pessoal: não é guardada em lugar nenhum além da tela aberta.
- Duas abas abertas: cada uma tem o próprio histórico, sem compartilhamento.

## Requirements *(mandatory)*

### Functional Requirements

**Entrada e envio**

- **FR-001**: O sistema DEVE oferecer um campo para o nome do usuário e um campo para a pergunta, ambos obrigatórios.
- **FR-002**: O sistema DEVE tratar nome ou pergunta compostos só de espaços como vazios.
- **FR-003**: O sistema DEVE aceitar nome com até 120 caracteres e pergunta com até 4000, recusar o envio acima disso e indicar o limite junto ao campo.
- **FR-004**: O sistema DEVE validar nome e pergunta antes do envio, sem fazer chamada à API quando a validação falhar.
- **FR-005**: O sistema DEVE enviar o nome e a pergunta à API real do orquestrador, e não a uma resposta simulada.
- **FR-006**: Durante um envio em andamento, o sistema DEVE mostrar um indicador de progresso, impedir qualquer novo envio (por clique ou teclado) e fazer no máximo uma chamada por ação da pessoa.
- **FR-007**: O sistema DEVE aplicar um tempo limite à espera pela resposta, após o qual encerra o envio e informa o tempo esgotado.

**Resposta e identificação**

- **FR-008**: O sistema DEVE exibir o texto da resposta como texto simples, sem interpretar marcação.
- **FR-009**: O sistema DEVE identificar, para cada resposta, o agente que respondeu (Orquestrador AI ou Agente RH) em linguagem que a pessoa entenda.
- **FR-010**: O sistema DEVE exibir, para cada resposta recebida: tokens de entrada, de cache e de saída; custo estimado em USD; duração; `idExecucao`; e `traceId`.
- **FR-011**: O sistema DEVE rotular o custo e os tokens como "do orquestrador" e NÃO DEVE apresentá-los como custo ou consumo total dos agentes.
- **FR-012**: O sistema DEVE exibir o custo com no mínimo 6 casas decimais, indicando USD, sem arredondar para 2 casas e sem notação científica.
- **FR-013**: O sistema DEVE exibir a duração em unidade legível e rotulada.
- **FR-014**: O sistema DEVE permitir copiar `idExecucao` e `traceId` sem alteração.

**Falhas**

- **FR-015**: O sistema DEVE distinguir e exibir mensagens claras, em português, para: entrada inválida, falha na execução, API indisponível e tempo esgotado.
- **FR-016**: O sistema NÃO DEVE exibir stack trace, nome de classe, corpo bruto de erro nem outro detalhe interno.
- **FR-017**: Quando a mensagem de erro da API trouxer `idExecucao` e `traceId`, o sistema DEVE exibi-los junto ao erro.
- **FR-018**: Em qualquer erro, o sistema DEVE exibir o custo como "desconhecido" e NÃO DEVE exibir zero.
- **FR-019**: O sistema NÃO DEVE reenviar automaticamente uma pergunta que falhou. Após a falha, o envio é liberado e a pergunta continua no campo.

**Estados, exemplos e histórico**

- **FR-020**: Com o histórico vazio, o sistema DEVE exibir uma tela inicial com as três perguntas de exemplo: "Olá! O que você pode fazer?", "Explique o que é uma API REST." e "Como solicito férias?".
- **FR-021**: Ao escolher um exemplo, o sistema DEVE preencher o campo de pergunta e NÃO DEVE enviar sem ação explícita da pessoa.
- **FR-022**: O sistema DEVE manter um histórico visual das perguntas, respostas e falhas da sessão enquanto a página estiver aberta.
- **FR-023**: O sistema NÃO DEVE persistir o histórico, o nome, as perguntas nem as respostas além da página aberta.
- **FR-024**: O sistema DEVE oferecer a ação "Limpar histórico", que remove todas as entradas e restaura a tela inicial.
- **FR-025**: O sistema NÃO DEVE afirmar nem sugerir que o histórico da tela é memória conversacional do agente, e DEVE avisar que cada pergunta é enviada de forma independente.

**Qualidade da interface**

- **FR-026**: O sistema DEVE ser operável só com teclado, com rótulos associados aos campos, foco visível e estados (enviando, erro) anunciados a leitores de tela.
- **FR-027**: O sistema DEVE funcionar sem rolagem horizontal em telas a partir de 320 px de largura e em desktop.
- **FR-028**: O sistema NÃO DEVE conter nem enviar chave de provedor de modelo, e DEVE falar apenas com a API do orquestrador.

### Key Entities *(include if feature involves data)*

- **Pergunta**: nome do usuário e texto da pergunta, como digitados, com os limites de 120 e 4000 caracteres.
- **Resposta da execução**: texto da resposta, agente que respondeu, destino (direto ou RH), protocolo, tokens de entrada, de cache e de saída do orquestrador, custo do orquestrador em USD, duração em milissegundos, `idExecucao` e `traceId`.
- **Falha**: categoria (entrada inválida, falha na execução, indisponível, tempo esgotado), mensagem para a pessoa e, quando existirem, `idExecucao` e `traceId`. O custo de uma falha é sempre "desconhecido".
- **Entrada do histórico**: a pergunta enviada junto com o seu resultado, que é uma resposta ou uma falha. Existe apenas na tela aberta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa que abre a página pela primeira vez consegue enviar uma pergunta de exemplo e ver a resposta em até 3 ações (escolher o exemplo, informar o nome, enviar).
- **SC-002**: Em 100% dos testes de envio repetido durante uma execução em andamento (clique duplo, Enter repetido), a API recebe exatamente uma chamada.
- **SC-003**: Em 100% das respostas bem-sucedidas, a pessoa identifica o agente que respondeu e vê os sete dados de consumo e rastreio sem sair da tela.
- **SC-004**: Um custo de 0,000123 USD é exibido de forma distinguível de zero em 100% dos casos, e nenhum custo maior que zero aparece como 0,00.
- **SC-005**: Para cada uma das quatro categorias de falha, a mensagem exibida permite à pessoa dizer a causa provável (dado inválido, falha do servidor, API fora do ar, demora excessiva), e há zero reenvios automáticos.
- **SC-006**: Toda a jornada (preencher, enviar, ler a resposta, limpar) é concluída apenas com teclado e sem rolagem horizontal em 320 px de largura.
- **SC-007**: Após "Limpar histórico" ou recarregar a página, 0 entradas permanecem visíveis.
- **SC-008**: Nenhum texto da interface afirma que o agente lembra de perguntas anteriores, conferido por revisão de todos os textos da tela.
- **SC-009**: Em 100% dos casos com texto de resposta contendo marcação HTML, o texto aparece literalmente e nada é executado.

## Assumptions

**Contrato real da API (levantado no código, sem alteração):**

- Endpoint `POST /api/orquestrador/executar`, servido na porta 8083.
- Entrada: `usuario` (obrigatório, até 120) e `pergunta` (obrigatória, até 4000).
- Saída com sucesso: `idExecucao`, `traceId`, `agenteExecutado` ("Orquestrador AI" ou "Agente RH AI"), `protocolo`, `destino` ("DIRETO" ou "RH"), `resposta`, `tokensEntradaOrquestrador`, `tokensCacheOrquestrador`, `tokensSaidaOrquestrador`, `custoOrquestradorUsd` e `duracaoMs`.
- Falha de execução: status 502, ou 503 em falha de banco, em formato de detalhe de problema com título "Falha no orquestrador". `idExecucao` e `traceId` vêm apenas dentro do texto do campo de detalhe, não como campos próprios.
- Erro de validação (400): o código não define tratamento próprio, então o formato esperado é o padrão do framework. **Isso não foi verificado com a aplicação em execução**; a tela não deve depender do formato e trata qualquer 400 como entrada inválida.
- A resposta de erro não traz tokens nem custo, portanto o custo de uma falha é sempre desconhecido.
- A API processa cada pergunta de forma independente: só a pergunta atual é enviada ao modelo. Não há memória de conversa no backend.
- Tokens e custo cobrem só a chamada de decisão do orquestrador. O consumo do Agente RH não está incluído.

**Escolhas desta especificação:**

- O tempo limite de espera é de 180 segundos, definido no plano. Cobre o pior caso do backend (leitura do modelo de decisão de até 60 s mais até 90 s do Agente RH), para não cortar uma resposta legítima do RH.
- O histórico segue ordem cronológica, como numa conversa, e a nova entrada fica visível ao ser adicionada.
- Em sucesso, o campo de pergunta é limpo; em falha, é mantido. O nome é mantido em ambos os casos.
- Escolher um exemplo apenas preenche o campo, porque cada envio gera custo de modelo e deve ser uma decisão explícita.
- A interface é em português do Brasil.
- O histórico não precisa de confirmação ao limpar, pois nada é persistido.

**Dependências e limites:**

- O backend já está em execução e não é alterado (constituição, princípios I e X). O backend não tem CORS configurado, então o plano deve resolver a chamada a partir do navegador sem mudar o Java, ou justificar a mudança antes de fazê-la.
- O campo `usuario` é um valor digitado, sem autenticação. A interface não o apresenta como login.
- A pergunta pode conter dado pessoal; por isso não é gravada além da tela aberta.
- Fora do escopo: login, cadastro, streaming, upload, banco de dados no frontend, painel administrativo e publicação.
- O escopo cabe em uma aula de uma hora, com o backend já funcionando.
