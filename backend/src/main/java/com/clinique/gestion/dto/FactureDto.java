package com.clinique.gestion.dto;

import com.clinique.gestion.entity.StatutPaiement;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class FactureDto {
    private Long id;
    private String numeroFacture;
    private Long patientId;
    private String patientNom;
    private Long medecinId;
    private String medecinNom;
    private Long consultationId;
    private LocalDate dateFacture;
    private BigDecimal montantTotal;
    private BigDecimal montantPaye;
    private StatutPaiement statut;
    private String notes;
    private LocalDateTime dateCreation;
    private List<LigneFactureDto> lignes = new ArrayList<>();

    @Data
    public static class LigneFactureDto {
        private Long id;
        private String description;
        private Integer quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal total;
    }
}
