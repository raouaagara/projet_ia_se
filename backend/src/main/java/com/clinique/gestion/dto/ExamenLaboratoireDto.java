package com.clinique.gestion.dto;

import com.clinique.gestion.entity.StatutExamen;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExamenLaboratoireDto {

    private Long id;

    @NotNull
    private Long patientId;

    @NotNull
    private Long medecinId;

    private Long consultationId;

    @NotBlank
    private String typeExamen;

    private String description;
    private StatutExamen statut;
    private LocalDate dateDemande;
    private LocalDate dateResultat;
    private String resultatTexte;
    private String fichierResultat;
    private String notes;
    private LocalDateTime dateCreation;

    // Enrichissement
    private String patientNom;
    private String medecinNom;
}
