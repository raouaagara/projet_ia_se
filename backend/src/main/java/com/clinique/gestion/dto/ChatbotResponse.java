package com.clinique.gestion.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatbotResponse {
    private String reponse;
    private String source;
}
