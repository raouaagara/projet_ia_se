package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicaments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 120)
    private String nomCommercial;

    /** Dénomination commune internationale (molécule). */
    @Column(length = 120)
    private String dci;

    @Column(length = 60)
    private String forme;

    @Column(length = 60)
    private String dosage;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(nullable = false)
    private int seuilAlerte;

    @Builder.Default
    private boolean surOrdonnance = true;

    @Builder.Default
    private boolean actif = true;

    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) dateCreation = LocalDateTime.now();
    }

    public String libelle() {
        StringBuilder sb = new StringBuilder(nomCommercial);
        if (dosage != null && !dosage.isBlank()) sb.append(' ').append(dosage);
        if (forme != null && !forme.isBlank()) sb.append(" (").append(forme).append(')');
        return sb.toString();
    }
}
