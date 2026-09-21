package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ExamenDto;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.service.ExamenService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Actions spécifiques sur un examen (saisie de résultat, changement de statut).
 * Le CRUD de base (/api/examens, /{id}, /patient, /medecin) est géré par ExamenLaboratoireController.
 */
@RestController
@RequestMapping("/api/examens")
@RequiredArgsConstructor
@Tag(name = "Examens laboratoire")
public class ExamenController {

    private final ExamenService examenService;

    @PutMapping("/{id}/resultat")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public ExamenDto saisirResultat(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return examenService.saisirResultat(id, body.get("resultat"), body.get("fichier"));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public ExamenDto updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return examenService.updateStatut(id, StatutExamen.valueOf(body.get("statut")));
    }
}
