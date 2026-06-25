package com.botleague.backend.common.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Year;

@Service
public class BotleagueIdService {

    private final JdbcTemplate jdbcTemplate;

    public BotleagueIdService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String generateBotleagueUserId() {
        return generateId("botleague_user_seq_", "BLU");
    }

    public String generateBotLeagueTeamId() {
        return generateId("botleague_team_seq_", "BLT");
    }
    
    public String generateBotLeagueRobotId() {
    	 return generateId("botleague_robot_seq_", "BLR");
    }
    public String generateBotLeagueEventId() {
   	 return generateId("botleague_event_seq_", "BLE");
   }

    private String generateId(String sequencePrefix, String idPrefix) {

        String year = String.valueOf(Year.now()).substring(2);

        String sequenceName = sequencePrefix + year;

        jdbcTemplate.execute(
                "CREATE SEQUENCE IF NOT EXISTS " + sequenceName + " START 1"
        );

        Long seq = jdbcTemplate.queryForObject(
                "SELECT nextval('" + sequenceName + "')",
                Long.class
        );

        String number = String.format("%05d", seq);

        return idPrefix + year + number;
    }
}