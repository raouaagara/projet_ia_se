package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OrdonnanceDto {
    private Long id;

    @NotNull
    private Long consultationId;

    private LocalDate dateEmission;

    @NotBlank
    private String medicaments;

    private String posologie;
    private String instructions;
    private String patientNom;
    private String medecinNom;
}
