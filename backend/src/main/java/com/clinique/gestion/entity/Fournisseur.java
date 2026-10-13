package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fournisseurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nom;

    @Column(length = 30)
    private String telephone;

    @Column(length = 120)
    private String email;

    @Column(length = 200)
    private String adresse;

    @Builder.Default
    private boolean actif = true;
}
