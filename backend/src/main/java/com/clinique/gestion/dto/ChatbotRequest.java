package com.clinique.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatbotRequest {
    @NotBlank(message = "le message est vide")
    @Size(max = 2000, message = "le message est trop long (2000 caractères maximum)")
    private String message;
    /** Identifiant de la conversation (renvoyé par le serveur au premier message), pour l'historique. */
    @Size(max = 64)
    private String sessionId;
}
