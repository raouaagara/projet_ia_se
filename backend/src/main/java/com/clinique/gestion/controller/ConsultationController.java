package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ConsultationDto;
import com.clinique.gestion.service.ConsultationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@Tag(name = "Consultations")
public class ConsultationController {

    private final ConsultationService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<ConsultationDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ConsultationDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<ConsultationDto> findByPatient(@PathVariable Long patientId) {
        return service.findByPatient(patientId);
    }

    @GetMapping("/medecin/{medecinId}")
    public List<ConsultationDto> findByMedecin(@PathVariable Long medecinId) {
        return service.findByMedecin(medecinId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ConsultationDto create(@Valid @RequestBody ConsultationDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public ConsultationDto update(@PathVariable Long id, @Valid @RequestBody ConsultationDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
