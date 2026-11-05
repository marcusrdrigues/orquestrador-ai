CREATE TABLE IF NOT EXISTS auditoria_execucao (
    id UUID PRIMARY KEY,
    trace_id VARCHAR(64) NOT NULL,

    usuario VARCHAR(120) NOT NULL,
    pergunta_sha256 CHAR(64) NOT NULL,

    inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fim TIMESTAMPTZ,
    duracao_ms BIGINT,

    status VARCHAR(30) NOT NULL,
    destino VARCHAR(20),

    modelo_solicitado VARCHAR(120),
    modelo_retornado VARCHAR(120),
    openai_request_id VARCHAR(160),

    tokens_entrada BIGINT,
    tokens_cache BIGINT,
    tokens_saida BIGINT,

    tarifa_entrada NUMERIC(18,8),
    tarifa_cache NUMERIC(18,8),
    tarifa_saida NUMERIC(18,8),

    custo_usd NUMERIC(18,10),
    uso_conhecido BOOLEAN NOT NULL DEFAULT FALSE,

    erro_tipo VARCHAR(160)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_inicio
    ON auditoria_execucao(inicio);

CREATE INDEX IF NOT EXISTS idx_auditoria_trace
    ON auditoria_execucao(trace_id);