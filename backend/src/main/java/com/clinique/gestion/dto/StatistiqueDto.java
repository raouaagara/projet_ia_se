package com.clinique.gestion.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StatistiqueDto {
    private long patients;
    private long medecins;
    private long medecinsDisponibles;
    private long rendezVous;
    private long consultations;
    private long ordonnances;
    private long rendezVousPlanifies;
    private long rendezVousConfirmes;
    private long rendezVousAnnules;
    private long rendezVousTermines;
    private long utilisateurs;
    private double tauxConfirmation;
    private double tauxAnnulation;
    // Facturation
    private long facturesTotal;
    private long facturesPayees;
    private long facturesEnAttente;
    private BigDecimal revenusTotal;
    // Examens
    private long examensTotal;
}
