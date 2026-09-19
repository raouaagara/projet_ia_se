package com.clinique.gestion.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class StatistiqueDetailDto {

    // Stats de base
    private long patients;
    private long medecins;
    private long medecinsDisponibles;
    private long rendezVous;
    private long consultations;
    private long ordonnances;

    // Stats RDV
    private long rendezVousPlanifies;
    private long rendezVousConfirmes;
    private long rendezVousAnnules;
    private long rendezVousTermines;
    private double tauxConfirmation;
    private double tauxAnnulation;

    // Stats facturation
    private long facturesTotal;
    private long facturesPayees;
    private long facturesEnAttente;
    private BigDecimal revenusTotal;
    private BigDecimal revenusMoisActuel;

    // Stats examens
    private long examensTotal;
    private long examensDemandes;
    private long examensResultatsDisponibles;

    // Stats utilisateurs
    private long utilisateurs;

    // Top médecins par RDV
    private List<MedecinStatDto> topMedecins;

    @Data
    @Builder
    public static class MedecinStatDto {
        private String nomMedecin;
        private String specialite;
        private long nbRendezVous;
        private long nbConsultations;
    }
}
