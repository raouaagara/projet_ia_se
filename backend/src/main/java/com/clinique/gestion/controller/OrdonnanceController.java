package com.clinique.gestion.controller;

import com.clinique.gestion.dto.OrdonnanceDto;
import com.clinique.gestion.service.OrdonnanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordonnances")
@RequiredArgsConstructor
@Tag(name = "Ordonnances")
public class OrdonnanceController {

    private final OrdonnanceService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public List<OrdonnanceDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public OrdonnanceDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<OrdonnanceDto> findByPatient(@PathVariable Long patientId) {
        return service.findByPatient(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public OrdonnanceDto create(@Valid @RequestBody OrdonnanceDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public OrdonnanceDto update(@PathVariable Long id, @Valid @RequestBody OrdonnanceDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
