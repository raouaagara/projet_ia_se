package com.clinique.gestion.dto.ia;

import com.clinique.gestion.entity.NiveauUrgence;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class TriageResultatDto {
    private Long id;
    private String symptomes;
    private String specialite;
    private NiveauUrgence niveauUrgence;
    private String justification;
    private String conseils;
    private String source;
    private LocalDateTime dateTriage;
    private List<MedecinSuggere> medecins = new ArrayList<>();
    private String avertissement;

    @Data
    public static class MedecinSuggere {
        private Long id;
        private String nom;
        private String specialite;
        private String horaires;
    }
}
