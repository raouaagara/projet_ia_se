package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ia.AnalyseIADto;
import com.clinique.gestion.dto.ia.JournalIADto;
import com.clinique.gestion.dto.ia.PrevisionsDto;
import com.clinique.gestion.dto.ia.StatutIADto;
import com.clinique.gestion.dto.ia.TriageRequest;
import com.clinique.gestion.dto.ia.TriageResultatDto;
import com.clinique.gestion.service.AssistantIAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
@Tag(name = "IA et aide à la décision")
public class IAController {

    private final AssistantIAService service;

    @PostMapping("/triage")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Pré-triage des symptômes : spécialité, niveau d'urgence et médecins suggérés")
    public TriageResultatDto triage(@Valid @RequestBody TriageRequest request) {
        return service.trier(request.getSymptomes());
    }

    @GetMapping("/triages/moi")
    @PreAuthorize("hasRole('PATIENT')")
    public List<TriageResultatDto> mesTriages() {
        return service.mesTriages();
    }

    @PostMapping("/resume-dossier/{patientId}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Résumé du dossier patient pour préparer une consultation")
    public AnalyseIADto resumeDossier(@PathVariable Long patientId) {
        return service.resumerDossier(patientId);
    }

    @PostMapping("/interpretation/{examenId}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    @Operation(summary = "Aide à l'interprétation d'un résultat d'examen")
    public AnalyseIADto interpretation(@PathVariable Long examenId) {
        return service.interpreterExamen(examenId);
    }

    @PutMapping("/analyses/{id}/validation")
    @PreAuthorize("hasRole('MEDECIN')")
    @Operation(summary = "Validation humaine d'une analyse générée par l'IA")
    public AnalyseIADto valider(@PathVariable Long id) {
        return service.valider(id);
    }

    @GetMapping("/analyses/patient/{patientId}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    public List<AnalyseIADto> analysesPatient(@PathVariable Long patientId) {
        return service.analysesPatient(patientId);
    }

    @GetMapping("/analyses/examen/{examenId}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN')")
    public List<AnalyseIADto> analysesExamen(@PathVariable Long examenId) {
        return service.analysesExamen(examenId);
    }

    @GetMapping("/previsions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Prévisions d'affluence, créneaux à risque d'annulation et risques de rupture de stock")
    public PrevisionsDto previsions() {
        return service.previsions();
    }

    @GetMapping("/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public StatutIADto statut() {
        return service.statut();
    }

    @GetMapping("/journal")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Journal des appels aux fonctions d'IA")
    public List<JournalIADto> journal() {
        return service.journalAppels();
    }
}
