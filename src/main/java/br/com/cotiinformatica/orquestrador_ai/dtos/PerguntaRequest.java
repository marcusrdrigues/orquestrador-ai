package br.com.cotiinformatica.orquestrador_ai.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PerguntaRequest(

        @NotBlank
        @Size(max = 120)
        String usuario,

        @NotBlank
        @Size(max = 4000)
        String pergunta

) {
}