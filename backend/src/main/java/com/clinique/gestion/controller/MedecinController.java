package com.clinique.gestion.controller;

import com.clinique.gestion.dto.MedecinDto;
import com.clinique.gestion.service.MedecinService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medecins")
@RequiredArgsConstructor
@Tag(name = "Médecins")
public class MedecinController {

    private final MedecinService service;

    @GetMapping
    public List<MedecinDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public MedecinDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<MedecinDto> findByUtilisateur(@PathVariable Long utilisateurId) {
        MedecinDto dto = service.findByUtilisateur(utilisateurId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MedecinDto create(@Valid @RequestBody MedecinDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public MedecinDto update(@PathVariable Long id, @Valid @RequestBody MedecinDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
