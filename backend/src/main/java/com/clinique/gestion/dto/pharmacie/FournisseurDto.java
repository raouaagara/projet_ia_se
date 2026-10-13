package com.clinique.gestion.dto.pharmacie;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FournisseurDto {
    private Long id;

    @NotBlank(message = "le nom est obligatoire")
    @Size(max = 120)
    private String nom;

    @Size(max = 30)
    private String telephone;

    @Email(message = "email invalide")
    @Size(max = 120)
    private String email;

    @Size(max = 200)
    private String adresse;

    private boolean actif = true;
}
