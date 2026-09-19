package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsultationDto {
    private Long id;

    @NotNull
    private Long patientId;

    @NotNull
    private Long medecinId;

    private Long rendezVousId;
    private LocalDateTime dateConsultation;
    private String diagnostic;
    private String observations;
    private String traitement;
    private String patientNom;
    private String medecinNom;
}
