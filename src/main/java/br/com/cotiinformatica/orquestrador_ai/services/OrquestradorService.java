package br.com.cotiinformatica.orquestrador_ai.services;

import br.com.cotiinformatica.orquestrador_ai.dtos.*;
import br.com.cotiinformatica.orquestrador_ai.repositories.AuditoriaRepository;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class OrquestradorService {

    private static final Logger log =
            LoggerFactory.getLogger(OrquestradorService.class);

    private final AgenteDecisorService decisor;
    private final AgenteRhA2AClient rh;
    private final AuditoriaRepository auditoria;
    private final TraceService traces;
    private final MeterRegistry metrics;
    private final String modelo;

    public OrquestradorService(
            AgenteDecisorService decisor,
            AgenteRhA2AClient rh,
            AuditoriaRepository auditoria,
            TraceService traces,
            MeterRegistry metrics,

            @Value("${app.openai.model}")
            String modelo) {

        this.decisor = decisor;
        this.rh = rh;
        this.auditoria = auditoria;
        this.traces = traces;
        this.metrics = metrics;
        this.modelo = modelo;
    }

    public OrquestracaoResponse executar(
            PerguntaRequest request) {

        return traces.executar(
                "orquestrador.executar",
                () -> processar(request)
        );
    }

    private OrquestracaoResponse processar(
            PerguntaRequest request) {

        UUID id = UUID.randomUUID();
        String traceId = traces.traceId();

        long inicio = System.nanoTime();

        String destino = "INDEFINIDO";
        String status = "ERRO";

        boolean auditoriaIniciada = false;

        try {

            auditoria.iniciar(
                    id,
                    traceId,
                    request.usuario(),
                    sha256(request.pergunta()),
                    modelo
            );

            auditoriaIniciada = true;

            log.info("Execução iniciada id={}", id);

            ResultadoDecisao resultado = traces.executar(
                    "openai.decidir",
                    () -> decisor.decidir(
                            id,
                            request.pergunta()
                    )
            );

            Consumo consumo = resultado.consumo();

            metrics.counter(
                    "orquestrador.llm.tokens",
                    "tipo", "entrada"
            ).increment(consumo.tokensEntrada());

            metrics.counter(
                    "orquestrador.llm.tokens",
                    "tipo", "saida"
            ).increment(consumo.tokensSaida());

            Decisao decisao = resultado.decisao();
            destino = decisao.destino().name();

            auditoria.registrarDestino(id, destino);

            String resposta;
            String agente;
            String protocolo;

            if (decisao.destino() == Destino.RH) {

                log.info(
                        "Delegando ao RH id={} destino=RH",
                        id
                );

                resposta = traces.executar(
                        "a2a.rh.executar",
                        () -> rh.executar(request.pergunta())
                );

                agente = "Agente RH AI";
                protocolo = "A2A";

            } else {

                resposta = decisao.resposta();
                agente = "Orquestrador AI";
                protocolo = "RESPOSTA_DIRETA";
            }

            long duracao = duracaoMs(inicio);

            traces.executar(
                    "auditoria.finalizar",
                    () -> {
                        auditoria.finalizar(
                                id,
                                "SUCESSO",
                                duracao,
                                null
                        );
                        return true;
                    }
            );

            status = "SUCESSO";

            log.info(
                    "Execução concluída id={} destino={} " +
                    "duracaoMs={} custoUsd={}",
                    id,
                    destino,
                    duracao,
                    consumo.custoUsd()
            );

            return new OrquestracaoResponse(
                    id.toString(),
                    traceId,
                    agente,
                    protocolo,
                    destino,
                    resposta,
                    consumo.tokensEntrada(),
                    consumo.tokensCache(),
                    consumo.tokensSaida(),
                    consumo.custoUsd(),
                    duracao
            );

        } catch (RuntimeException e) {

            if (auditoriaIniciada) {

                try {

                    auditoria.finalizar(
                            id,
                            "ERRO",
                            duracaoMs(inicio),
                            e.getClass().getSimpleName()
                    );

                } catch (RuntimeException erroAuditoria) {

                    log.error(
                            "Falha ao finalizar auditoria id={} tipo={}",
                            id,
                            erroAuditoria.getClass()
                                    .getSimpleName()
                    );
                }
            }

            /*
             * Não gravamos a mensagem completa da exceção,
             * pois ela pode conter corpo de resposta remoto.
             */
            log.error(
                    "Execução falhou id={} tipo={}",
                    id,
                    e.getClass().getSimpleName()
            );

            HttpStatus httpStatus =
                    e instanceof DataAccessException
                            ? HttpStatus.SERVICE_UNAVAILABLE
                            : HttpStatus.BAD_GATEWAY;

            throw new ResponseStatusException(
                    httpStatus,
                    "Não foi possível concluir a execução. " +
                    "idExecucao=" + id +
                    "; traceId=" + traceId
            );

        } finally {

            metrics.counter(
                    "orquestrador.execucoes",
                    "destino", destino,
                    "status", status
            ).increment();

            Timer.builder("orquestrador.duracao")
                    .tag("destino", destino)
                    .tag("status", status)
                    .register(metrics)
                    .record(
                            System.nanoTime() - inicio,
                            TimeUnit.NANOSECONDS
                    );
        }
    }

    private long duracaoMs(long inicio) {

        return TimeUnit.NANOSECONDS.toMillis(
                System.nanoTime() - inicio
        );
    }

    private String sha256(String texto) {

        try {

            byte[] bytes = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                            texto.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return HexFormat.of().formatHex(bytes);

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(e);
        }
    }
}