package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "examens_laboratoire")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamenLaboratoire {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;

    @ManyToOne
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @Column(nullable = false, length = 200)
    private String typeExamen;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutExamen statut;

    @Column(nullable = false)
    private LocalDate dateDemande;

    private LocalDate dateResultat;

    @Lob
    private String resultatTexte;

    @Column(length = 500)
    private String fichierResultat; // URL/chemin du fichier uploadé

    @Column(length = 500)
    private String notes;

    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) dateCreation = LocalDateTime.now();
        if (dateDemande == null) dateDemande = LocalDate.now();
        if (statut == null) statut = StatutExamen.DEMANDE;
    }
}
