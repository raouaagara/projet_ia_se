package com.clinique.gestion.dto.ia;

import lombok.Data;

@Data
public class StatutIADto {
    private String fournisseur;
    private boolean modeleConnecte;
    private String modele;
    private long appelsTotal;
    private long appelsModele;
    private long appelsRegles;
    private long echecs;
}
