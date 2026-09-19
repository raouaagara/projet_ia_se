package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ExamenLaboratoireDto;
import com.clinique.gestion.service.ExamenLaboratoireService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/examens")
@RequiredArgsConstructor
@Tag(name = "Examens & Laboratoire")
public class ExamenLaboratoireController {

    private final ExamenLaboratoireService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','LABO')")
    public List<ExamenLaboratoireDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT','LABO')")
    public ExamenLaboratoireDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT','LABO')")
    public List<ExamenLaboratoireDto> findByPatient(@PathVariable Long patientId) {
        return service.findByPatient(patientId);
    }

    @GetMapping("/medecin/{medecinId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','LABO')")
    public List<ExamenLaboratoireDto> findByMedecin(@PathVariable Long medecinId) {
        return service.findByMedecin(medecinId);
    }

    /** Médecin crée une demande d'analyse */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ExamenLaboratoireDto create(@Valid @RequestBody ExamenLaboratoireDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','LABO')")
    public ExamenLaboratoireDto update(@PathVariable Long id,
                                       @Valid @RequestBody ExamenLaboratoireDto dto,
                                       @org.springframework.security.core.annotation.AuthenticationPrincipal
                                       org.springframework.security.core.userdetails.UserDetails principal) {
        // Extraire le rôle depuis les authorities
        String role = principal.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("OTHER");
        return service.updateWithRole(id, dto, role);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
