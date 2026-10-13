package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/** Trace de chaque appel aux fonctions d'IA (traçabilité et usage responsable). */
@Entity
@Table(name = "journal_ia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private FonctionIA fonction;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(length = 20)
    private String role;

    /** GROQ ou REGLES. */
    @Column(length = 20)
    private String source;

    @Column(length = 80)
    private String modele;

    private long dureeMs;

    private boolean succes;

    @Column(length = 255)
    private String erreur;

    private LocalDateTime dateAppel;

    @PrePersist
    public void prePersist() {
        if (dateAppel == null) dateAppel = LocalDateTime.now();
    }
}
