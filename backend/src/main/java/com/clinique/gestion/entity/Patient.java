package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numeroDossier;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, length = 80)
    private String prenom;

    private LocalDate dateNaissance;

    @Column(length = 10)
    private String sexe;

    @Column(length = 20)
    private String telephone;

    @Column(length = 180)
    private String adresse;

    @Column(length = 80)
    private String groupeSanguin;

    @Column(length = 255)
    private String allergies;

    @Column(length = 255)
    private String antecedents;

    @OneToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
