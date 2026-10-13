package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lignes_ordonnance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneOrdonnance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ordonnance_id")
    private Ordonnance ordonnance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medicament_id")
    private Medicament medicament;

    @Column(length = 255)
    private String posologie;

    private Integer dureeJours;

    /** Nombre de boîtes / unités prescrites. */
    @Column(nullable = false)
    private int quantite;

    /** Quantité déjà délivrée par la pharmacie (cumul des délivrances). */
    @Column(nullable = false, columnDefinition = "int default 0")
    @Builder.Default
    private int quantiteDelivree = 0;

    public int resteADelivrer() {
        return Math.max(0, quantite - quantiteDelivree);
    }
}
