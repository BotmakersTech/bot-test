package com.botleague.backend.events.dto;

import java.math.BigDecimal;

/**
 * One placing in an event sport's prize breakdown.
 * type = "MONEY"   -> amount is set, description null
 * type = "GOODIES" -> description is set, amount null
 * Serialized as a JSON array into EventSports.prizeDistributionJson.
 */
public class PrizePositionDTO {

    private Integer position;      // 1, 2, 3, ...
    private String type;           // MONEY | GOODIES
    private BigDecimal amount;     // for MONEY
    private String description;    // for GOODIES

    public PrizePositionDTO() {
    }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
