package com.botleague.backend.config;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.concurrent.Executor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.botleague.backend.audit.service.AuditLogService;

/**
 * Certificate generation runs on a small, bounded pool — this app runs on a
 * modest 2-core box shared with every other request-handling thread, and a
 * generation job is I/O-heavy (R2 reads/writes) rather than CPU-heavy, so a
 * couple of concurrent jobs is enough without starving the rest of the app.
 * A real queue (SQS/etc.) is the natural next step if job volume ever
 * outgrows this — not needed at current scale.
 *
 * Implements AsyncConfigurer so a failure in a void @Async method (the
 * common case — see CertificateGenerationWorker.runAsync) doesn't just
 * vanish into Spring's default handler's plain log line. This app has no
 * external alerting integration (Slack/PagerDuty/Sentry) yet, so an audit
 * log entry is the most visible place to surface it today — same pattern
 * MatchService.approveMatchResult already uses for its own fail-open
 * ranking-award path.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    private final AuditLogService auditLogService;

    public AsyncConfig(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

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

    /**
     * NotificationService.systemNotify/teamNotifyExcluding (see L10) run
     * per-registration/team-member recipient-resolution loops that were
     * previously synchronous on the calling request thread — a separate,
     * small pool so a large event's notification fan-out can't compete with
     * the cert-gen pool it has nothing to do with.
     */
    @Bean(name = "notificationExecutor")
    public ThreadPoolTaskExecutor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("notify-");
        executor.initialize();
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return certificateGenerationExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (Throwable ex, Method method, Object... params) -> {
            String paramSummary = Arrays.toString(params);
            log.error("Uncaught exception in @Async method {}.{} with params {}",
                    method.getDeclaringClass().getSimpleName(), method.getName(), paramSummary, ex);
            try {
                auditLogService.log("ASYNC_TASK_FAILED",
                        method.getDeclaringClass().getSimpleName(), null, method.getName(),
                        null, null, ex.getMessage());
            } catch (Exception loggingFailure) {
                log.error("Failed to audit-log the above async failure", loggingFailure);
            }
        };
    }
}
