package br.com.cotiinformatica.orquestrador_ai.controllers;

import br.com.cotiinformatica.orquestrador_ai.dtos.*;
import br.com.cotiinformatica.orquestrador_ai.services.*;

import jakarta.validation.Valid;

import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

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

    @PostMapping("/executar")
    public OrquestracaoResponse executar(
            @Valid @RequestBody PerguntaRequest request) {

        return service.executar(request);
    }

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

    @GetMapping("/status")
    public Map<String, String> status() {

        return Map.of(
                "aplicacao", "Orquestrador AI",
                "status", "Executando"
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> tratarFalha(
            ResponseStatusException e) {

        ProblemDetail problema =
                ProblemDetail.forStatusAndDetail(
                        e.getStatusCode(),
                        e.getReason() == null
                                ? "Falha na execução."
                                : e.getReason()
                );

        problema.setTitle("Falha no orquestrador");

        return ResponseEntity
                .status(e.getStatusCode())
                .body(problema);
    }
}