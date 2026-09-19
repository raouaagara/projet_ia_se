package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LigneFactureDto {
    private Long id;

    @NotBlank
    private String description;

    @NotNull
    private Integer quantite;

    @NotNull
    private BigDecimal prixUnitaire;

    private BigDecimal total;
}
