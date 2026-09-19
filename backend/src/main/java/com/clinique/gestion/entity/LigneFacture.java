package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_facture")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneFacture {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "facture_id")
    private Facture facture;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @PrePersist
    @PreUpdate
    public void calculerTotal() {
        if (quantite != null && prixUnitaire != null) {
            this.total = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}
