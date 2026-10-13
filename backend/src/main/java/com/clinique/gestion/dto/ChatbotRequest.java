package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatbotRequest {
    @NotBlank(message = "le message est vide")
    @Size(max = 2000, message = "le message est trop long (2000 caractères maximum)")
    private String message;
}
