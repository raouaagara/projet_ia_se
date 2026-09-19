package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypeNotification type;

    @Column(nullable = false)
    private boolean lue = false;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    // Référence optionnelle vers une entité liée
    private Long referenceId;

    @Column(length = 50)
    private String referenceType; // "RDV", "EXAMEN", "ORDONNANCE", "FACTURE"

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) dateCreation = LocalDateTime.now();
    }
}
