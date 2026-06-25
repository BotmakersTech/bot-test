package com.botleague.backend.config;

import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * Treat an empty JSON string "" as null for enum fields.
     * This allows partial PATCH payloads where optional enum fields are
     * omitted or sent as "" — they will deserialize to null and be
     * skipped by the service's null-checks instead of crashing Jackson.
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder.postConfigurer(mapper ->
            mapper.coercionConfigFor(LogicalType.Enum)
                  .setCoercion(CoercionInputShape.EmptyString, CoercionAction.AsNull)
        );
    }
}
