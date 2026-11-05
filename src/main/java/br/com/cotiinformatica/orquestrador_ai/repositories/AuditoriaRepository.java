package br.com.cotiinformatica.orquestrador_ai.repositories;

import br.com.cotiinformatica.orquestrador_ai.dtos.Consumo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public class AuditoriaRepository {

    private final JdbcTemplate jdbc;

    public AuditoriaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void iniciar(
            UUID id,
            String traceId,
            String usuario,
            String perguntaHash,
            String modelo) {

        jdbc.update("""
                INSERT INTO auditoria_execucao
                    (id, trace_id, usuario, pergunta_sha256,
                     status, modelo_solicitado)
                VALUES (?, ?, ?, ?, 'INICIADA', ?)
                """,
                id,
                traceId,
                usuario,
                perguntaHash,
                modelo
        );
    }

    public void registrarConsumo(
            UUID id,
            String modeloRetornado,
            String requestId,
            Consumo consumo,
            BigDecimal tarifaEntrada,
            BigDecimal tarifaCache,
            BigDecimal tarifaSaida) {

        jdbc.update("""
                UPDATE auditoria_execucao
                   SET modelo_retornado = ?,
                       openai_request_id = ?,
                       tokens_entrada = ?,
                       tokens_cache = ?,
                       tokens_saida = ?,
                       tarifa_entrada = ?,
                       tarifa_cache = ?,
                       tarifa_saida = ?,
                       custo_usd = ?,
                       uso_conhecido = TRUE
                 WHERE id = ?
                """,
                modeloRetornado,
                requestId,
                consumo.tokensEntrada(),
                consumo.tokensCache(),
                consumo.tokensSaida(),
                tarifaEntrada,
                tarifaCache,
                tarifaSaida,
                consumo.custoUsd(),
                id
        );
    }

    public void registrarDestino(UUID id, String destino) {

        jdbc.update("""
                UPDATE auditoria_execucao
                   SET destino = ?
                 WHERE id = ?
                """,
                destino,
                id
        );
    }

    public void finalizar(
            UUID id,
            String status,
            long duracaoMs,
            String erroTipo) {

        jdbc.update("""
                UPDATE auditoria_execucao
                   SET fim = CURRENT_TIMESTAMP,
                       status = ?,
                       duracao_ms = ?,
                       erro_tipo = ?
                 WHERE id = ?
                """,
                status,
                duracaoMs,
                erroTipo,
                id
        );
    }
}