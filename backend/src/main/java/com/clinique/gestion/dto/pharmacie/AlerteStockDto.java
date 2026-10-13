package com.clinique.gestion.dto.pharmacie;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteStockDto {
    /** RUPTURE, STOCK_BAS, PERIME, PEREMPTION_PROCHE */
    private String type;
    /** CRITIQUE ou ATTENTION */
    private String niveau;
    private Long medicamentId;
    private String medicamentNom;
    private Long lotId;
    private String numeroLot;
    private long quantite;
    private LocalDate datePeremption;
    private String message;
}
