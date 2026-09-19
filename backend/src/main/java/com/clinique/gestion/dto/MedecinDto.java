package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MedecinDto {
    private Long id;
    private String matricule;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    @NotBlank
    private String specialite;

    private String telephone;
    private String email;
    private String horaires;
    private String faculte;
    private boolean disponible = true;
    private Long utilisateurId;
}
