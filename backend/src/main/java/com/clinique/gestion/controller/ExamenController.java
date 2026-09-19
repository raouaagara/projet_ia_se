package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ExamenDto;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.service.ExamenService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/examens")
@RequiredArgsConstructor
@Tag(name = "Examens laboratoire")
public class ExamenController {

    private final ExamenService examenService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<ExamenDto> findAll() { return examenService.findAll(); }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ExamenDto findById(@PathVariable Long id) { return examenService.findById(id); }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public List<ExamenDto> findByPatient(@PathVariable Long patientId) {
        return examenService.findByPatient(patientId);
    }

    @GetMapping("/medecin/{medecinId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public List<ExamenDto> findByMedecin(@PathVariable Long medecinId) {
        return examenService.findByMedecin(medecinId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ExamenDto create(@RequestBody ExamenDto dto) { return examenService.create(dto); }

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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public void delete(@PathVariable Long id) { examenService.delete(id); }
}
