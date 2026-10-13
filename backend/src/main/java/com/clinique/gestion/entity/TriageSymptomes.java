package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "triages_symptomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageSymptomes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Lob
    @Column(nullable = false, length = 65535)
    private String symptomes;

    @Column(length = 120)
    private String specialiteSuggeree;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private NiveauUrgence niveauUrgence;

    @Column(length = 1000)
    private String justification;

    @Column(length = 1000)
    private String conseils;

    /** GROQ (modèle de langage) ou REGLES (moteur de règles local). */
    @Column(length = 20)
    private String source;

    private LocalDateTime dateTriage;

    @PrePersist
    public void prePersist() {
        if (dateTriage == null) dateTriage = LocalDateTime.now();
    }
}
