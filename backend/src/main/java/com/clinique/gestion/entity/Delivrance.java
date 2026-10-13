package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "delivrances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivrance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ordonnance_id")
    private Ordonnance ordonnance;

    @ManyToOne
    @JoinColumn(name = "pharmacien_id")
    private Utilisateur pharmacien;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private StatutDelivrance statut;

    @Column(precision = 10, scale = 2)
    private BigDecimal montantTotal;

    @ManyToOne
    @JoinColumn(name = "facture_id")
    private Facture facture;

    private LocalDateTime dateDelivrance;

    @OneToMany(mappedBy = "delivrance", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneDelivrance> lignes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (dateDelivrance == null) dateDelivrance = LocalDateTime.now();
    }
}
