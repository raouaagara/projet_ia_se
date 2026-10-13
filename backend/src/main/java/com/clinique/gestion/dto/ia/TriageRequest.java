package com.clinique.gestion.dto.ia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TriageRequest {
    @NotBlank(message = "décrivez vos symptômes")
    @Size(min = 5, max = 2000, message = "la description doit contenir entre 5 et 2000 caractères")
    private String symptomes;
}
