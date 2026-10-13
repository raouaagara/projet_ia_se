package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "lots_medicament")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LotMedicament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medicament_id")
    private Medicament medicament;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    @Column(nullable = false, length = 40)
    private String numeroLot;

    @Column(nullable = false)
    private int quantiteInitiale;

    @Column(nullable = false)
    private int quantiteRestante;

    @Column(nullable = false)
    private LocalDate datePeremption;

    @Column(nullable = false)
    private LocalDate dateReception;

    @Column(precision = 10, scale = 2)
    private BigDecimal prixAchat;

    public boolean estPerime() {
        return datePeremption.isBefore(LocalDate.now());
    }
}
