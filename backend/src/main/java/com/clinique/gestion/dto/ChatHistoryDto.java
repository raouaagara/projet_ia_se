package com.clinique.gestion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatHistoryDto {
    private String sessionId;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private int nbMessages;
    private List<ChatMessageDto> messages;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChatMessageDto {
        private Long id;
        private String role;       // 'user' ou 'bot'
        private String contenu;
        private String source;
        private LocalDateTime dateMessage;
    }
}
