package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_utilisateur", columnList = "utilisateur_id"),
    @Index(name = "idx_chat_session", columnList = "sessionId"),
    @Index(name = "idx_chat_date", columnList = "dateMessage")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    /** Identifiant de session pour regrouper les échanges */
    @Column(nullable = false, length = 64)
    private String sessionId;

    /** 'user' ou 'bot' */
    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    /** Source de la réponse bot : 'GROQ', 'REGLES', 'BACKEND' */
    @Column(length = 20)
    private String source;

    @Column(nullable = false)
    private LocalDateTime dateMessage;

    @PrePersist
    protected void onCreate() {
        if (dateMessage == null) dateMessage = LocalDateTime.now();
    }
}
