package com.clinique.gestion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatbotResponse {
    private String reponse;
    private String source;
    private String sessionId;

    /** Constructeur de compatibilité utilisé par le fallback règles */
    public ChatbotResponse(String reponse, String source) {
        this.reponse = reponse;
        this.source  = source;
    }
}
