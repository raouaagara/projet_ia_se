package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ResultatLaboDto {

    @NotNull
    private Long examenId;

    @NotBlank
    private String resultatTexte;

    private String fichierResultat;
    private String notes;
    private LocalDate dateResultat;
}
