package com.clinique.gestion.dto.ia;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class PrevisionsDto {
    private int semainesAnalysees;
    private long rendezVousAnalyses;
    private double tauxAnnulation;
    private List<JourSemaine> parJour = new ArrayList<>();
    private List<JourPrevu> prochainsJours = new ArrayList<>();
    private List<CreneauRisque> creneauxARisque = new ArrayList<>();
    private List<RisqueRupture> risquesRupture = new ArrayList<>();
    private List<String> recommandations = new ArrayList<>();

    @Data
    public static class JourSemaine {
        private String jour;
        private double moyenne;
        private double tauxAnnulation;
    }

    @Data
    public static class JourPrevu {
        private LocalDate date;
        private String jour;
        private long dejaPlanifies;
        private long prevus;
        /** FAIBLE, NORMALE ou FORTE (comparée à la moyenne). */
        private String charge;
    }

    @Data
    public static class CreneauRisque {
        private String jour;
        private int heure;
        private long rendezVous;
        private double tauxAnnulation;
    }

    @Data
    public static class RisqueRupture {
        private Long medicamentId;
        private String medicament;
        private long stock;
        private double consommationJournaliere;
        private long joursCouverture;
    }
}
