package com.botleague.backend.timetrial.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ShortlistRoundRequestDTO {

    @NotNull(message = "cutoffCount is required")
    @Min(value = 1, message = "cutoffCount must be at least 1")
    private Integer cutoffCount;

    public Integer getCutoffCount() { return cutoffCount; }
    public void setCutoffCount(Integer cutoffCount) { this.cutoffCount = cutoffCount; }
}
