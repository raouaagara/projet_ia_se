package com.clinique.gestion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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
    @Column(nullable = false)
    private String medicaments;

    @Column(length = 255)
    private String posologie;

    @Column(length = 255)
    private String instructions;
}
