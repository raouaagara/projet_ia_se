package com.clinique.gestion.dto.pharmacie;

import com.clinique.gestion.entity.StatutDelivrance;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class DelivranceDto {
    private Long id;
    private Long ordonnanceId;
    private String patientNom;
    private String numeroDossier;
    private String medecinNom;
    private String pharmacienNom;
    private StatutDelivrance statut;
    private BigDecimal montantTotal;
    private Long factureId;
    private String numeroFacture;
    private LocalDateTime dateDelivrance;
    private List<Ligne> lignes = new ArrayList<>();
    private List<String> avertissements = new ArrayList<>();

    @Data
    public static class Ligne {
        private String medicamentNom;
        private String numeroLot;
        private LocalDate datePeremption;
        private int quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal total;
    }
}
