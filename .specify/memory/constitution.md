<!--
Sync Impact Report
- Mudança de versão: (template em branco) → 1.0.0
- Princípios adicionados: I a XI (11 princípios, conforme pedido; o template previa 5)
- Seções adicionadas: Restrições Adicionais, Fluxo de Trabalho, Governança
- Seções removidas: nenhuma
- Pendências adiadas: nenhuma
-->
# Frontend do Orquestrador AI — Constituição

## Princípios Fundamentais

### I. Preservar a API Java e seu contrato
O backend e o contrato de `POST /api/orquestrador/executar` não mudam por causa do frontend. O
frontend se adapta ao contrato real (campos `usuario` e `pergunta` na entrada; `agenteExecutado`,
`destino`, `tokens*Orquestrador`, `custoOrquestradorUsd`, `duracaoMs` e `traceId` na saída), e não
o contrário. Diferenças de nome entre o desejado e o real são resolvidas na camada de serviço do
frontend.

### II. Frontend isolado na pasta `frontend`
Todo código, configuração e dependência do frontend ficam em `frontend/`, na raiz do repositório.
Nenhum arquivo do frontend entra em `src/` do projeto Java. O backend continua compilando e
rodando sem a pasta `frontend/`.

### III. Interface simples, acessível e responsiva
A tela cumpre uma tarefa: enviar a pergunta e mostrar o resultado. Os requisitos mínimos são:
HTML semântico, rótulo associado a cada campo, operação completa por teclado, foco visível,
contraste legível, estados anunciados a leitores de tela (`aria-live` para carregando e erro) e
layout que funcione de 320 px de largura até desktop, sem rolagem horizontal.

### IV. Toda comunicação HTTP em um módulo de serviço
Somente o módulo de serviço faz chamadas HTTP. Componentes e telas não usam `fetch`/`HttpClient`
diretamente. O módulo concentra a URL base, o timeout, a tradução da resposta e a classificação
dos erros. A URL base vem de configuração, não de string solta no código.

### V. Nenhuma chave da OpenAI no navegador
O frontend fala apenas com a API do orquestrador. Ele nunca contém, recebe, armazena nem envia
chave de provedor de modelo ou qualquer outro segredo, nem em variável de ambiente de build, que
acaba embutida no pacote. Se o navegador precisar de segredo para funcionar, o desenho está errado.

### VI. API real, sem mocks
A integração usa a API real do orquestrador. Mock, fixture ou resposta simulada não substitui a
chamada nem é entregue como parte do produto. Testes automatizados podem usar dublê do módulo de
serviço, mas a entrega é validada contra o backend em execução.

### VII. Carregamento, erro e indisponibilidade tratados
Toda chamada tem estado de carregamento visível, impede envio duplicado e tem timeout. A tela
distingue: validação (400), falha de execução (502/503), API fora do ar ou rede indisponível e
timeout. Cada caso mostra mensagem clara em português, sem expor stack trace nem detalhe interno.
Quando o erro traz `traceId`, ele é exibido para suporte.

### VIII. Dependências mínimas
Cada dependência nova precisa de justificativa: para que serve, se é mantida e qual a licença.
O que o navegador e o framework escolhido já oferecem não ganha biblioteca. Versões são fixadas.

### IX. Custo exibido com precisão
O custo vem em dólar e costuma ser fração de centavo. Ele é exibido com no mínimo 6 casas
decimais, com a moeda indicada, nunca arredondado para 2 casas e nunca em notação científica.
Um custo realmente zero aparece como zero, não como campo vazio. O valor é exibido como veio da
API, sem recalcular.

### X. Backend só muda se for indispensável
Alteração no backend exige justificativa registrada antes de ser feita: o que não funciona sem
ela, qual alternativa no frontend foi descartada e por quê, e que o contrato existente continua
válido. Sem essa justificativa aprovada, o backend não é tocado. Exemplo: o backend não tem CORS
configurado; a solução preferida é um proxy do servidor de desenvolvimento, que não altera o Java.

### XI. Sem commit e sem publicação nesta atividade
Esta atividade não cria commits, não faz push, não abre PR e não publica a aplicação em nenhum
ambiente. O resultado fica no diretório de trabalho para revisão do mantenedor.

## Restrições Adicionais

- **Escopo da aula:** o trabalho cabe em uma aula de uma hora, com o backend já em execução. A
  entrega é uma tela com formulário (`usuario`, `pergunta`) e painel de resultado (resposta,
  agente, destino, tokens, custo, duração, `traceId`). Histórico, login, múltiplas páginas e
  persistência ficam fora do escopo.
- **Limites de entrada:** o formulário respeita `usuario` ≤ 120 e `pergunta` ≤ 4000 caracteres e
  campos obrigatórios. É conveniência de uso; a validação que vale continua sendo a do backend.
- **Identidade:** `usuario` é um valor digitado, sem autenticação no backend. A interface não o
  apresenta como login nem como prova de identidade.
- **Dados pessoais (LGPD):** a pergunta pode conter dado pessoal. O frontend não a grava em
  `localStorage`, `sessionStorage` nem em console, e só a envia à API do orquestrador.
- **Conteúdo da resposta:** a resposta do modelo é conteúdo não confiável. É exibida como texto,
  nunca como HTML interpretado.
- **Testes:** o comportamento do frontend (módulo de serviço, estados de carregamento e erro,
  formatação de custo) entra com teste automatizado.

## Fluxo de Trabalho

1. A funcionalidade segue Spec-Driven Development: especificação, plano, tarefas e só então
   implementação.
2. As tarefas são ordenadas para o escopo de uma hora: primeiro o módulo de serviço e a chamada
   real, depois o formulário, depois os estados de erro e a formatação.
3. Antes de dar a atividade por concluída, o frontend é exercitado contra o backend real e os
   testes são executados. Se algo não foi executado ou falhou, isso é dito com a saída.
4. Toda proposta de mudança no backend passa pela justificativa do princípio X antes de qualquer
   edição.

## Governança

Esta constituição prevalece sobre outras práticas para o trabalho do frontend. Emendas exigem
registro por escrito do motivo, atualização da versão e revisão dos artefatos de spec, plano e
tarefas que dependam do princípio alterado.

**Versionamento:** MAJOR para remoção ou redefinição incompatível de princípio; MINOR para novo
princípio ou ampliação material; PATCH para esclarecimento de redação.

**Conformidade:** spec, plano e tarefas são conferidos contra os princípios I a XI antes de
aprovados. Desvio é registrado com justificativa, e o princípio X tem prioridade sobre qualquer
conveniência de implementação.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
