package com.botleague.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Certificate generation runs on a small, bounded pool — this app runs on a
 * modest 2-core box shared with every other request-handling thread, and a
 * generation job is I/O-heavy (R2 reads/writes) rather than CPU-heavy, so a
 * couple of concurrent jobs is enough without starving the rest of the app.
 * A real queue (SQS/etc.) is the natural next step if job volume ever
 * outgrows this — not needed at current scale.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "certificateGenerationExecutor")
    public ThreadPoolTaskExecutor certificateGenerationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("cert-gen-");
        executor.initialize();
        return executor;
    }
}
