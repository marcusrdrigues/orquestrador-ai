package br.com.cotiinformatica.orquestrador_ai.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.cotiinformatica.orquestrador_ai.dtos.OrquestracaoResponse;
import br.com.cotiinformatica.orquestrador_ai.dtos.PerguntaRequest;

@Service
public class OrquestradorService {

    private final AgenteRhA2AClient agenteRhA2AClient;

    public OrquestradorService(
            AgenteRhA2AClient agenteRhA2AClient) {

        this.agenteRhA2AClient = agenteRhA2AClient;
    }

    public OrquestracaoResponse executar(
            PerguntaRequest request) {

        // 1. Identificar a execução.
        String idExecucao = UUID.randomUUID().toString();

        // 2. Delegar a solicitação ao Agente RH por A2A.
        String resposta = agenteRhA2AClient.executar(
                request.pergunta()
        );

        // 3. Devolver o resultado ao usuário.
        return new OrquestracaoResponse(
                idExecucao,
                "Agente RH AI",
                "A2A",
                resposta
        );
    }
}
