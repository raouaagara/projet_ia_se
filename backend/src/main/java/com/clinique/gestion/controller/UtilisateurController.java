package com.clinique.gestion.controller;

import com.clinique.gestion.dto.UtilisateurDto;
import com.clinique.gestion.service.UtilisateurService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs")
public class UtilisateurController {

    private final UtilisateurService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UtilisateurDto> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public UtilisateurDto findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UtilisateurDto create(@Valid @RequestBody UtilisateurDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public UtilisateurDto update(@PathVariable Long id, @Valid @RequestBody UtilisateurDto dto,
                                  @org.springframework.security.core.annotation.AuthenticationPrincipal
                                  org.springframework.security.core.userdetails.UserDetails principal) {
        return service.update(id, dto, principal.getUsername());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
