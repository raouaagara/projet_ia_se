package com.clinique.gestion.dto;

import com.clinique.gestion.entity.StatutDelivrance;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrdonnanceDto {
    private Long id;

    @NotNull
    private Long consultationId;

    private LocalDate dateEmission;

    /** Texte libre (anciennes ordonnances) ; généré automatiquement à partir des lignes sinon. */
    private String medicaments;

    private String posologie;
    private String instructions;

    @Valid
    private List<LigneOrdonnanceDto> lignes = new ArrayList<>();

    // ── Lecture seule ──
    private StatutDelivrance statutDelivrance;
    private Long patientId;
    private String patientNom;
    private String numeroDossier;
    private Long medecinId;
    private String medecinNom;
}
