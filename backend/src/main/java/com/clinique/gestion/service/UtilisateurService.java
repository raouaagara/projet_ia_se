package com.clinique.gestion.service;

import com.clinique.gestion.dto.UtilisateurDto;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository repository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public UtilisateurDto findById(Long id) {
        return toDto(repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable")));
    }

    public UtilisateurDto create(UtilisateurDto dto) {
        if (repository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }
        Utilisateur entity = toEntity(dto);
        entity.setId(null);
        entity.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse() == null ? "password" : dto.getMotDePasse()));
        return toDto(repository.save(entity));
    }

    public UtilisateurDto update(Long id, UtilisateurDto dto, String callerEmail) {
        Utilisateur existing = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        // Vérifier que l'utilisateur modifie son propre compte (sauf ADMIN)
        Utilisateur caller = repository.findByEmail(callerEmail)
            .orElseThrow(() -> new IllegalArgumentException("Appelant introuvable"));

        boolean isAdmin = caller.getRole().name().equals("ADMIN");
        if (!isAdmin && !caller.getId().equals(id)) {
            throw new org.springframework.security.access.AccessDeniedException("Vous ne pouvez modifier que votre propre compte.");
        }

        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setTelephone(dto.getTelephone());
        existing.setEmail(dto.getEmail());
        // Ne changer le rôle que si admin et rôle fourni
        if (isAdmin && dto.getRole() != null) {
            existing.setRole(dto.getRole());
        }
        if (isAdmin) {
            existing.setActif(dto.isActif());
        }
        // Médecin rattaché (secrétaire)
        if (dto.getMedecinRattacheId() != null) {
            existing.setMedecinRattacheId(dto.getMedecinRattacheId());
        }
        if (dto.getMotDePasse() != null && !dto.getMotDePasse().isBlank()) {
            existing.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        }
        return toDto(repository.save(existing));
    }

    // Surcharge pour compatibilité admin sans email caller
    public UtilisateurDto update(Long id, UtilisateurDto dto) {
        return update(id, dto, "admin@clinique.local");
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private UtilisateurDto toDto(Utilisateur entity) {
        UtilisateurDto dto = new UtilisateurDto();
        dto.setId(entity.getId());
        dto.setEmail(entity.getEmail());
        dto.setNom(entity.getNom());
        dto.setPrenom(entity.getPrenom());
        dto.setTelephone(entity.getTelephone());
        dto.setRole(entity.getRole());
        dto.setActif(entity.isActif());
        dto.setMedecinRattacheId(entity.getMedecinRattacheId());
        return dto;
    }

    private Utilisateur toEntity(UtilisateurDto dto) {
        return Utilisateur.builder()
                .id(dto.getId())
                .email(dto.getEmail())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .telephone(dto.getTelephone())
                .role(dto.getRole())
                .actif(dto.isActif())
                .build();
    }
}
