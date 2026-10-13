package com.clinique.gestion.dto.ia;

import com.clinique.gestion.entity.TypeAnalyseIA;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnalyseIADto {
    private Long id;
    private TypeAnalyseIA type;
    private Long patientId;
    private Long examenId;
    private String contenu;
    private String source;
    private String modele;
    private boolean validee;
    private String valideePar;
    private LocalDateTime dateGeneration;
    private LocalDateTime dateValidation;
    private String avertissement;
}
