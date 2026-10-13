package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "analyses_ia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyseIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private TypeAnalyseIA type;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "examen_id")
    private ExamenLaboratoire examen;

    @Lob
    @Column(nullable = false, length = 65535)
    private String contenu;

    @Column(length = 20)
    private String source;

    @Column(length = 80)
    private String modele;

    @ManyToOne
    @JoinColumn(name = "demandeur_id")
    private Utilisateur demandeur;

    /** Validation humaine obligatoire avant tout usage clinique. */
    @Builder.Default
    private boolean validee = false;

    @ManyToOne
    @JoinColumn(name = "valide_par_id")
    private Utilisateur validePar;

    private LocalDateTime dateGeneration;
    private LocalDateTime dateValidation;

    @PrePersist
    public void prePersist() {
        if (dateGeneration == null) dateGeneration = LocalDateTime.now();
    }
}
