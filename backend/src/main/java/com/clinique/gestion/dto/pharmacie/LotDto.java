package com.clinique.gestion.dto.pharmacie;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LotDto {
    private Long id;
    private Long medicamentId;
    private String medicamentNom;
    private Long fournisseurId;
    private String fournisseurNom;
    private String numeroLot;
    private int quantiteInitiale;
    private int quantiteRestante;
    private LocalDate datePeremption;
    private LocalDate dateReception;
    private BigDecimal prixAchat;
    private boolean perime;
    private long joursAvantPeremption;
}
