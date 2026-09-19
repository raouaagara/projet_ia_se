package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ExamenLaboratoireDto;
import com.clinique.gestion.dto.ResultatLaboDto;
import com.clinique.gestion.service.LaboService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labo")
@RequiredArgsConstructor
@Tag(name = "Laboratoire")
public class LaboController {

    private final LaboService laboService;

    /**
     * Publie un résultat d'examen.
     * Enregistre le résultat ET envoie les notifications dans une transaction atomique.
     * Accessible : ADMIN, MEDECIN, SECRETAIRE
     */
    @PostMapping("/resultats")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','LABO')")
    public ExamenLaboratoireDto publierResultat(@Valid @RequestBody ResultatLaboDto dto) {
        return laboService.publierResultat(dto);
    }
}
