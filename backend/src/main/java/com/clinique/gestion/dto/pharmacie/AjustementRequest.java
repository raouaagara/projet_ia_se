package com.clinique.gestion.dto.pharmacie;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AjustementRequest {
    @NotNull(message = "le lot est obligatoire")
    private Long lotId;

    @Min(value = 0, message = "la quantité ne peut pas être négative")
    private int nouvelleQuantite;

    @NotBlank(message = "le motif est obligatoire")
    @Size(max = 255)
    private String motif;
}
