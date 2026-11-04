package br.com.cotiinformatica.orquestrador_ai.services;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.BiConsumer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.a2a.A2A;
import io.a2a.client.Client;
import io.a2a.client.ClientEvent;
import io.a2a.client.TaskEvent;
import io.a2a.client.config.ClientConfig;
import io.a2a.client.transport.jsonrpc.JSONRPCTransport;
import io.a2a.client.transport.jsonrpc.JSONRPCTransportConfig;
import io.a2a.spec.AgentCard;
import io.a2a.spec.Artifact;
import io.a2a.spec.Message;
import io.a2a.spec.Part;
import io.a2a.spec.Task;
import io.a2a.spec.TextPart;

@Service
public class AgenteRhA2AClient {

    private final String agentUrl;
    private final String cardPath;
    private final long timeoutSeconds;

    public AgenteRhA2AClient(
            @Value("${app.agents.rh.url}") String agentUrl,
            @Value("${app.agents.rh.card-path}") String cardPath,
            @Value("${app.agents.rh.timeout-seconds:90}")
            long timeoutSeconds) {

        this.agentUrl = agentUrl;
        this.cardPath = cardPath;
        this.timeoutSeconds = timeoutSeconds;
    }

    // Descobrir o agente pelo Agent Card.
    public AgentCard descobrirAgente() {

        return A2A.getAgentCard(
                agentUrl,
                cardPath,
                null
        );
    }

    // Executar o Agente RH utilizando o SDK A2A.
    public String executar(String pergunta) {

        try {

            // 1. Descoberta do agente remoto.
            AgentCard card = descobrirAgente();

            // 2. Criar mensagem A2A.
            Message mensagem = new Message.Builder()
                    .role(Message.Role.USER)
                    .parts(List.of(
                            new TextPart(pergunta, null)
                    ))
                    .build();

            // 3. Objeto que receberá a resposta assíncrona.
            CompletableFuture<String> respostaFuture =
                    new CompletableFuture<>();

            AtomicReference<String> respostaTexto =
                    new AtomicReference<>("");

            // 4. Consumidor dos eventos A2A.
            BiConsumer<ClientEvent, AgentCard> consumer =
                    (evento, agentCard) -> {

                        if (evento instanceof TaskEvent taskEvent) {

                            Task task = taskEvent.getTask();

                            if (task == null) {
                                return;
                            }

                            // Recupera os resultados produzidos.
                            String texto = extrairTexto(task);

                            if (!texto.isBlank()) {
                                respostaTexto.set(texto);
                            }

                            String estado = task.getStatus()
                                    .state()
                                    .toString()
                                    .toUpperCase();

                            // Aguarda a conclusão da tarefa.
                            if (estado.contains("COMPLETED")) {

                                respostaFuture.complete(
                                        respostaTexto.get()
                                );

                            } else if (estado.contains("FAILED")
                                    || estado.contains("CANCELED")
                                    || estado.contains("CANCELLED")
                                    || estado.contains("REJECTED")) {

                                respostaFuture.completeExceptionally(
                                        new IllegalStateException(
                                                "Tarefa A2A terminou em: "
                                                        + estado
                                        )
                                );
                            }
                        }
                    };

            // 5. Configuração do cliente A2A.
            ClientConfig config = new ClientConfig.Builder()
                    .setAcceptedOutputModes(List.of("text"))
                    .build();

            // 6. Construir o cliente com transporte JSON-RPC.
            Client client = Client.builder(card)
                    .clientConfig(config)
                    .withTransport(
                            JSONRPCTransport.class,
                            new JSONRPCTransportConfig()
                    )
                    .addConsumers(List.of(consumer))
                    .build();

            // 7. Enviar a mensagem ao RH AI.
            client.sendMessage(mensagem);

            // 8. Aguardar o resultado da execução.
            String resultado = respostaFuture.get(
                    timeoutSeconds,
                    TimeUnit.SECONDS
            );

            if (resultado.isBlank()) {
                throw new IllegalStateException(
                        "O Agente RH concluiu sem retornar texto."
                );
            }

            return resultado;

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Execução A2A interrompida.",
                    e
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Erro ao executar Agente RH por A2A: "
                            + e.getMessage(),
                    e
            );
        }
    }

    // Extrai o texto dos artefatos da tarefa A2A.
    private String extrairTexto(Task task) {

        StringBuilder texto = new StringBuilder();

        if (task.getArtifacts() == null) {
            return "";
        }

        for (Artifact artifact : task.getArtifacts()) {

            if (artifact.parts() == null) {
                continue;
            }

            for (Part<?> part : artifact.parts()) {

                if (part instanceof TextPart textPart) {

                    texto.append(
                            textPart.getText()
                    );
                }
            }
        }

        return texto.toString();
    }
}
