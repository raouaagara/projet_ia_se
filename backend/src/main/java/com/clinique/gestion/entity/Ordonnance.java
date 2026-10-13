package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordonnances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ordonnance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @Column(nullable = false)
    private LocalDate dateEmission;

    @Lob
    @Column(nullable = false, length = 65535)
    private String medicaments;

    @Column(length = 255)
    private String posologie;

    @Column(length = 255)
    private String instructions;

    /** Lignes structurées (médicament du catalogue de la pharmacie, posologie, durée, quantité). */
    @OneToMany(mappedBy = "ordonnance", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<LigneOrdonnance> lignes = new ArrayList<>();

    /** Avancement de la délivrance par la pharmacie (null = ordonnance antérieure, non structurée). */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private StatutDelivrance statutDelivrance;
}
