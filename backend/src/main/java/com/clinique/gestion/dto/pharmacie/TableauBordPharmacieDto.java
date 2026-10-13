package com.clinique.gestion.dto.pharmacie;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TableauBordPharmacieDto {
    private long medicamentsActifs;
    private long unitesEnStock;
    private BigDecimal valeurStock;
    private long ruptures;
    private long stocksBas;
    private long lotsPerimes;
    private long peremptionsProches;
    private long ordonnancesADelivrer;
    private long delivrancesAujourdhui;
    private long fournisseurs;
}
