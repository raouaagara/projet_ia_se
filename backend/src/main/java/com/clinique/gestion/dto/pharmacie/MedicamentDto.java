package com.clinique.gestion.dto.pharmacie;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class MedicamentDto {
    private Long id;

    @NotBlank(message = "le code est obligatoire")
    @Size(max = 30)
    private String code;

    @NotBlank(message = "le nom commercial est obligatoire")
    @Size(max = 120)
    private String nomCommercial;

    @Size(max = 120)
    private String dci;
    @Size(max = 60)
    private String forme;
    @Size(max = 60)
    private String dosage;

    @NotNull(message = "le prix unitaire est obligatoire")
    @DecimalMin(value = "0.0", message = "le prix doit être positif")
    private BigDecimal prixUnitaire;

    @Min(value = 0, message = "le seuil d'alerte doit être positif")
    private int seuilAlerte;

    private boolean surOrdonnance = true;
    private boolean actif = true;

    // ── Champs calculés (lecture seule) ──
    private String libelle;
    private long stockDisponible;
    private boolean sousSeuil;
    private boolean enRupture;
    private LocalDate prochainePeremption;
    private List<LotDto> lots;
}
