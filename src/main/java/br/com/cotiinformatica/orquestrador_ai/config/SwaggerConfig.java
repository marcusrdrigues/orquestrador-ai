package br.com.cotiinformatica.orquestrador_ai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("COTI — Agente Orquestrador de IA")
                        .version("1.0.0")
                        .description("""
                                API desenvolvida no curso de Arquiteto de IA
                                da COTI Informática.

                                O agente orquestrador recebe solicitações e utiliza
                                um modelo de linguagem da OpenAI para decidir entre
                                responder diretamente ou delegar a solicitação ao
                                Agente de RH por meio de comunicação A2A.

                                Funcionalidades:
                                - Decisão de encaminhamento utilizando LLM.
                                - Integração com agentes especializados via A2A.
                                - Acompanhamento do consumo de tokens e custos.
                                - Registro de auditoria das execuções.
                                - Rastreamento distribuído com Micrometer e Zipkin.
                                - Métricas de duração, sucesso e falha.
                                """)
                        .contact(new Contact()
                                .name("Professor Sergio Mendes — COTI Informática")
                                .url("https://www.cotiinformatica.com.br")));
    }
}