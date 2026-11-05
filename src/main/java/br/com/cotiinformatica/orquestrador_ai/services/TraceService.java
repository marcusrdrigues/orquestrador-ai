package br.com.cotiinformatica.orquestrador_ai.services;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;

import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Service
public class TraceService {

    private final Tracer tracer;

    public TraceService(Tracer tracer) {
        this.tracer = tracer;
    }

    public <T> T executar(
            String nome,
            Supplier<T> operacao) {

        Span span = tracer.nextSpan()
                .name(nome)
                .start();

        try (Tracer.SpanInScope scope =
                     tracer.withSpan(span)) {

            return operacao.get();

        } catch (RuntimeException e) {

            span.error(e);
            throw e;

        } finally {

            span.end();
        }
    }

    public String traceId() {

        Span span = tracer.currentSpan();

        if (span == null) {
            throw new IllegalStateException(
                    "Não existe trace ativo."
            );
        }

        return span.context().traceId();
    }
}