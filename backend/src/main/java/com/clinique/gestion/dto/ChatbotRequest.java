package com.clinique.gestion.dto;

import lombok.Data;

@Data
public class ChatbotRequest {
    private String message;
    private String contexte;
    private String role;       // ADMIN | MEDECIN | SECRETAIRE | PATIENT
    private String userName;   // prénom de l'utilisateur connecté
}
