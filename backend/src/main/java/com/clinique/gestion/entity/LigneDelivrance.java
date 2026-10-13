package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_delivrance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneDelivrance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "delivrance_id")
    private Delivrance delivrance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ligne_ordonnance_id")
    private LigneOrdonnance ligneOrdonnance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lot_id")
    private LotMedicament lot;

    @Column(nullable = false)
    private int quantite;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;
}
