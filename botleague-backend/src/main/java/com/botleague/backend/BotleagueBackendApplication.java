package com.botleague.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling lives here rather than on AsyncConfig (which already has
// its own AsyncConfig -> AuditLogService -> AuditLogRepository -> JPA
// entityManagerFactory dependency chain) — this class has zero constructor
// dependencies, so it can't tip Spring's bean-resolution order into the
// entityManagerFactory <-> asyncConfig circular-reference failure that
// putting it on AsyncConfig caused in production.
@SpringBootApplication
@EnableScheduling
public class BotleagueBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BotleagueBackendApplication.class, args);
	}

}
