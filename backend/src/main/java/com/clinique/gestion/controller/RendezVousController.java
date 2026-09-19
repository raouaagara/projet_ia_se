package com.clinique.gestion.controller;

import com.clinique.gestion.dto.RendezVousDto;
import com.clinique.gestion.service.RendezVousService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rendez-vous")
@RequiredArgsConstructor
@Tag(name = "Rendez-vous")
public class RendezVousController {

    private final RendezVousService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<RendezVousDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public RendezVousDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<RendezVousDto> findByPatient(@PathVariable Long patientId) {
        return service.findByPatient(patientId);
    }

    @GetMapping("/medecin/{medecinId}")
    public List<RendezVousDto> findByMedecin(@PathVariable Long medecinId) {
        return service.findByMedecin(medecinId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','PATIENT')")
    public RendezVousDto create(@Valid @RequestBody RendezVousDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','MEDECIN')")
    public RendezVousDto update(@PathVariable Long id, @Valid @RequestBody RendezVousDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
