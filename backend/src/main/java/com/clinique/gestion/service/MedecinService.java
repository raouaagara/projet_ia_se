package com.clinique.gestion.service;

import com.clinique.gestion.dto.MedecinDto;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.MedecinRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MedecinService {

    private final MedecinRepository repository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public List<MedecinDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public MedecinDto findById(Long id) {
        return toDto(get(id));
    }

    public MedecinDto findByUtilisateur(Long utilisateurId) {
        return repository.findByUtilisateurId(utilisateurId).map(this::toDto).orElse(null);
    }

    public MedecinDto create(MedecinDto dto) {
        Medecin entity = toEntity(dto);
        entity.setId(null);
        if (entity.getMatricule() == null || entity.getMatricule().isBlank()) {
            entity.setMatricule("MED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        // Créer automatiquement un compte utilisateur MEDECIN si aucun n'est lié
        if (entity.getUtilisateur() == null && dto.getEmail() != null && !dto.getEmail().isBlank()) {
            entity.setUtilisateur(findOrCreateUtilisateur(dto));
        }
        Medecin saved = repository.save(entity);
        // Recharger depuis la base pour avoir toutes les relations correctement initialisées
        return toDto(repository.findById(saved.getId()).orElse(saved));
    }

    public MedecinDto update(Long id, MedecinDto dto) {
        Medecin existing = get(id);
        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setSpecialite(dto.getSpecialite());
        existing.setTelephone(dto.getTelephone());
        existing.setEmail(dto.getEmail());
        existing.setHoraires(dto.getHoraires());
        existing.setFaculte(dto.getFaculte());
        existing.setDisponible(dto.isDisponible());
        if (dto.getUtilisateurId() != null) {
            existing.setUtilisateur(utilisateurRepository.findById(dto.getUtilisateurId()).orElse(null));
        }
        // Si pas encore de compte et un email fourni, créer/lier le compte utilisateur
        if (existing.getUtilisateur() == null && dto.getEmail() != null && !dto.getEmail().isBlank()) {
            existing.setUtilisateur(findOrCreateUtilisateur(dto));
        }
        Medecin saved = repository.save(existing);
        // Recharger depuis la base pour avoir toutes les relations correctement initialisées
        return toDto(repository.findById(saved.getId()).orElse(saved));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private Medecin get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Médecin introuvable"));
    }

    private Utilisateur findOrCreateUtilisateur(MedecinDto dto) {
        String email = dto.getEmail();
        return utilisateurRepository.findByEmail(email).orElseGet(() ->
            utilisateurRepository.save(Utilisateur.builder()
                .email(email)
                .motDePasse(passwordEncoder.encode("password"))
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .telephone(dto.getTelephone())
                .role(Role.MEDECIN)
                .actif(true)
                .build())
        );
    }

    private MedecinDto toDto(Medecin entity) {
        MedecinDto dto = new MedecinDto();
        dto.setId(entity.getId());
        dto.setMatricule(entity.getMatricule());
        dto.setNom(entity.getNom());
        dto.setPrenom(entity.getPrenom());
        dto.setSpecialite(entity.getSpecialite());
        dto.setTelephone(entity.getTelephone());
        dto.setEmail(entity.getEmail());
        dto.setHoraires(entity.getHoraires());
        dto.setFaculte(entity.getFaculte());
        dto.setDisponible(entity.isDisponible());
        dto.setUtilisateurId(entity.getUtilisateur() != null ? entity.getUtilisateur().getId() : null);
        return dto;
    }

    private Medecin toEntity(MedecinDto dto) {
        return Medecin.builder()
                .matricule(dto.getMatricule())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .specialite(dto.getSpecialite())
                .telephone(dto.getTelephone())
                .email(dto.getEmail())
                .horaires(dto.getHoraires())
                .faculte(dto.getFaculte())
                .disponible(dto.isDisponible())
                .utilisateur(dto.getUtilisateurId() != null
                        ? utilisateurRepository.findById(dto.getUtilisateurId()).orElse(null)
                        : null)
                .build();
    }
}
