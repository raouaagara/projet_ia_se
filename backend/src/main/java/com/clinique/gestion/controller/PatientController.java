package com.clinique.gestion.controller;

import com.clinique.gestion.dto.PatientDto;
import com.clinique.gestion.service.PatientService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@Tag(name = "Patients")
public class PatientController {

    private final PatientService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<PatientDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/medecin/{medecinId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<PatientDto> findByMedecin(@PathVariable Long medecinId) {
        return service.findByMedecin(medecinId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public PatientDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public ResponseEntity<PatientDto> findByUtilisateur(@PathVariable Long utilisateurId) {
        PatientDto dto = service.findByUtilisateur(utilisateurId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','PATIENT')")
    public PatientDto create(@Valid @RequestBody PatientDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN','PATIENT')")
    public PatientDto update(@PathVariable Long id, @Valid @RequestBody PatientDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
