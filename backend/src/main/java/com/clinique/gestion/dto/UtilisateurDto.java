package com.clinique.gestion.dto;

import com.clinique.gestion.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UtilisateurDto {
    private Long id;

    @Email
    @NotBlank
    private String email;

    private String motDePasse;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    private String telephone;
    private Role role;
    private boolean actif = true;
    private Long medecinRattacheId;  // Pour SECRETAIRE : médecin auquel elle est rattachée
}
