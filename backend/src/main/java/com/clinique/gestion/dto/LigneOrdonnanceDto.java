package com.clinique.gestion.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LigneOrdonnanceDto {
    private Long id;

    @NotNull(message = "le médicament est obligatoire")
    private Long medicamentId;

    private String medicamentNom;

    @Size(max = 255)
    private String posologie;

    @Min(value = 1, message = "la durée doit être au moins d'un jour")
    private Integer dureeJours;

    @Min(value = 1, message = "la quantité doit être au moins 1")
    private int quantite = 1;

    // ── Lecture seule ──
    private int quantiteDelivree;
    private int resteADelivrer;
    private long stockDisponible;
}
