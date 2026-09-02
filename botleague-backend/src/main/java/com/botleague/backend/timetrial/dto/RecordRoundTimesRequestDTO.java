package com.botleague.backend.timetrial.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;

public class RecordRoundTimesRequestDTO {

    @NotEmpty(message = "entries is required")
    @Valid
    private List<EntryTimeDTO> entries;

    public List<EntryTimeDTO> getEntries() { return entries; }
    public void setEntries(List<EntryTimeDTO> entries) { this.entries = entries; }
}
