package com.clinique.gestion.dto.ia;

import com.clinique.gestion.entity.FonctionIA;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class JournalIADto {
    private Long id;
    private FonctionIA fonction;
    private String utilisateur;
    private String role;
    private String source;
    private String modele;
    private long dureeMs;
    private boolean succes;
    private String erreur;
    private LocalDateTime dateAppel;
}
