package com.clinique.gestion.dto;

import com.clinique.gestion.entity.StatutRendezVous;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RendezVousDto {
    private Long id;

    @NotNull
    private Long patientId;

    @NotNull
    private Long medecinId;

    @NotNull
    private LocalDateTime dateHeure;

    private String motif;
    private StatutRendezVous statut;
    private String notes;
    private String patientNom;
    private String medecinNom;
    private String specialite;
}
