package com.clinique.gestion.dto.pharmacie;

import com.clinique.gestion.entity.TypeMouvement;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MouvementDto {
    private Long id;
    private TypeMouvement type;
    private int quantite;
    private String motif;
    private LocalDateTime dateMouvement;
    private Long lotId;
    private String numeroLot;
    private Long medicamentId;
    private String medicamentNom;
    private String utilisateurNom;
}
