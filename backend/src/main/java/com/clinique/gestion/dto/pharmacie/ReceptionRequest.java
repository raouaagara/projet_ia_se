package com.clinique.gestion.dto.pharmacie;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReceptionRequest {
    @NotNull(message = "le médicament est obligatoire")
    private Long medicamentId;

    private Long fournisseurId;

    @NotBlank(message = "le numéro de lot est obligatoire")
    @Size(max = 40)
    private String numeroLot;

    @Min(value = 1, message = "la quantité doit être au moins 1")
    private int quantite;

    @NotNull(message = "la date de péremption est obligatoire")
    private LocalDate datePeremption;

    @DecimalMin(value = "0.0", message = "le prix d'achat doit être positif")
    private BigDecimal prixAchat;
}
