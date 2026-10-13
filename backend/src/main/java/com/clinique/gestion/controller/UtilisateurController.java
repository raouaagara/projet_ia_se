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
    @PreAuthorize("isAuthenticated()")
    public UtilisateurDto findById(@PathVariable Long id,
                                   @org.springframework.security.core.annotation.AuthenticationPrincipal
                                   org.springframework.security.core.userdetails.UserDetails principal) {
        UtilisateurDto u = service.findById(id);
        boolean admin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !u.getEmail().equalsIgnoreCase(principal.getUsername())) {
            throw new org.springframework.security.access.AccessDeniedException("Profil d'un autre utilisateur");
        }
        return u;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UtilisateurDto create(@Valid @RequestBody UtilisateurDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
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
