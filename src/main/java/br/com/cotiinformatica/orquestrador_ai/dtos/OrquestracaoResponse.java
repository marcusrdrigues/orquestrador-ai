package br.com.cotiinformatica.orquestrador_ai.dtos;

public record OrquestracaoResponse(

        String idExecucao,

        String agenteExecutado,

        String protocolo,

        String resposta

) {}
