package com.clinique.gestion.dto;

import com.clinique.gestion.entity.StatutExamen;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExamenDto {
    private Long id;
    private Long patientId;
    private String patientNom;
    private Long medecinId;
    private String medecinNom;
    private Long consultationId;
    private String typeExamen;
    private String description;
    private StatutExamen statut;
    private LocalDate dateDemande;
    private LocalDate dateResultat;
    private String resultatTexte;
    private String fichierResultat;
    private String notes;
    private LocalDateTime dateCreation;
}
