package br.com.cotiinformatica.orquestrador_ai.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.cotiinformatica.orquestrador_ai.dtos.OrquestracaoResponse;
import br.com.cotiinformatica.orquestrador_ai.dtos.PerguntaRequest;
import br.com.cotiinformatica.orquestrador_ai.services.AgenteRhA2AClient;
import br.com.cotiinformatica.orquestrador_ai.services.OrquestradorService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orquestrador")
public class OrquestradorController {

    private final OrquestradorService service;
    private final AgenteRhA2AClient a2aClient;

    public OrquestradorController(
            OrquestradorService service,
            AgenteRhA2AClient a2aClient) {

        this.service = service;
        this.a2aClient = a2aClient;
    }

    // Executa o Agente RH por A2A.
    @PostMapping("/executar")
    public OrquestracaoResponse executar(
            @Valid @RequestBody PerguntaRequest request) {

        return service.executar(request);
    }

    // Descobre o Agente RH pelo Agent Card.
    @GetMapping("/agentes/rh")
    public Map<String, Object> consultarAgenteRh() {

        var card = a2aClient.descobrirAgente();

        return Map.of(
                "nome", card.name(),
                "descricao", card.description(),
                "versao", card.version(),
                "protocolo", "A2A"
        );
    }

    // Verifica se o Orquestrador está iniciado.
    @GetMapping("/status")
    public Map<String, String> status() {

        return Map.of(
                "aplicacao", "Orquestrador AI",
                "status", "Executando"
        );
    }
}
