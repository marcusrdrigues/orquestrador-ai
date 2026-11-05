package br.com.cotiinformatica.orquestrador_ai.dtos;

import java.math.BigDecimal;

public record Consumo(
        long tokensEntrada,
        long tokensCache,
        long tokensSaida,
        BigDecimal custoUsd
) {
}