package com.clinique.gestion.dto.pharmacie;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DelivranceRequest {
    @NotNull(message = "l'ordonnance est obligatoire")
    private Long ordonnanceId;

    /** Quantités à délivrer par ligne ; si vide, tout le reste à délivrer est servi. */
    @Valid
    private List<Ligne> lignes = new ArrayList<>();

    /** Ajouter les médicaments délivrés à une facture du patient. */
    private boolean facturer = true;

    @Data
    public static class Ligne {
        @NotNull
        private Long ligneOrdonnanceId;
        @Min(0)
        private int quantite;
    }
}
