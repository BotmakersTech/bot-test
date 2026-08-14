package com.botleague.backend.catalog.dto;

/** One entry of LeagueSport.weightClassesJson, e.g. {"label":"60kg","weightKg":60}. */
public class WeightClassDTO {

    private String label;
    private Double weightKg;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
}
