package br.com.cotiinformatica.orquestrador_ai.dtos;

import java.math.BigDecimal;

public record OrquestracaoResponse(
        String idExecucao,
        String traceId,
        String agenteExecutado,
        String protocolo,
        String destino,
        String resposta,
        long tokensEntradaOrquestrador,
        long tokensCacheOrquestrador,
        long tokensSaidaOrquestrador,
        BigDecimal custoOrquestradorUsd,
        long duracaoMs
) {
}