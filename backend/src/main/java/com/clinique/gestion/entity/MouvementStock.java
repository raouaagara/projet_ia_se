package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "mouvements_stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MouvementStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lot_id")
    private LotMedicament lot;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TypeMouvement type;

    /** Variation de stock : positive pour une entrée, négative pour une sortie. */
    @Column(nullable = false)
    private int quantite;

    @Column(length = 255)
    private String motif;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    private LocalDateTime dateMouvement;

    @PrePersist
    public void prePersist() {
        if (dateMouvement == null) dateMouvement = LocalDateTime.now();
    }
}
