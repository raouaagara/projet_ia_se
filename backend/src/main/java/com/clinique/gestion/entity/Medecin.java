package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medecins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String matricule;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, length = 80)
    private String prenom;

    @Column(nullable = false, length = 80)
    private String specialite;

    @Column(length = 20)
    private String telephone;

    @Column(length = 120)
    private String email;

    @Column(length = 120)
    private String horaires;

    @Column(length = 150)
    private String faculte;

    private boolean disponible = true;

    @OneToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
