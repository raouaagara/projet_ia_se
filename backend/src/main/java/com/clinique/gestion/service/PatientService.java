package com.clinique.gestion.service;

import com.clinique.gestion.dto.PatientDto;
import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository repository;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurCourant utilisateurCourant;

    public List<PatientDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public List<PatientDto> findByMedecin(Long medecinId) {
        return repository.findPatientsByMedecinId(medecinId).stream().map(this::toDto).toList();
    }

    public PatientDto findById(Long id) {
        utilisateurCourant.verifierAccesPatient(id);
        return toDto(get(id));
    }

    public PatientDto findByUtilisateur(Long utilisateurId) {
        if (utilisateurCourant.aLeRole(Role.PATIENT) && !utilisateurCourant.requis().getId().equals(utilisateurId)) {
            throw new AccessDeniedException("Dossier d'un autre utilisateur");
        }
        return repository.findByUtilisateurId(utilisateurId).map(this::toDto)
                .orElse(null);
    }

    public PatientDto create(PatientDto dto) {
        // Un patient ne crée que son propre dossier, une seule fois.
        if (utilisateurCourant.aLeRole(Role.PATIENT)) {
            Utilisateur moi = utilisateurCourant.requis();
            if (repository.findByUtilisateurId(moi.getId()).isPresent()) {
                throw new IllegalStateException("Votre dossier patient existe déjà.");
            }
            dto.setUtilisateurId(moi.getId());
        }
        Patient entity = toEntity(dto);
        entity.setId(null);
        if (entity.getNumeroDossier() == null || entity.getNumeroDossier().isBlank()) {
            entity.setNumeroDossier("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return toDto(repository.save(entity));
    }

    public PatientDto update(Long id, PatientDto dto) {
        utilisateurCourant.verifierAccesPatient(id);
        Patient existing = get(id);
        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setDateNaissance(dto.getDateNaissance());
        existing.setSexe(dto.getSexe());
        existing.setTelephone(dto.getTelephone());
        existing.setAdresse(dto.getAdresse());
        existing.setGroupeSanguin(dto.getGroupeSanguin());
        existing.setAllergies(dto.getAllergies());
        existing.setAntecedents(dto.getAntecedents());
        // Le rattachement à un compte n'est modifiable que par le personnel.
        if (dto.getUtilisateurId() != null && !utilisateurCourant.aLeRole(Role.PATIENT)) {
            existing.setUtilisateur(utilisateurRepository.findById(dto.getUtilisateurId()).orElse(null));
        }
        return toDto(repository.save(existing));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private Patient get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Patient introuvable"));
    }

    private PatientDto toDto(Patient entity) {
        PatientDto dto = new PatientDto();
        dto.setId(entity.getId());
        dto.setNumeroDossier(entity.getNumeroDossier());
        dto.setNom(entity.getNom());
        dto.setPrenom(entity.getPrenom());
        dto.setDateNaissance(entity.getDateNaissance());
        dto.setSexe(entity.getSexe());
        dto.setTelephone(entity.getTelephone());
        dto.setAdresse(entity.getAdresse());
        dto.setGroupeSanguin(entity.getGroupeSanguin());
        dto.setAllergies(entity.getAllergies());
        dto.setAntecedents(entity.getAntecedents());
        dto.setUtilisateurId(entity.getUtilisateur() != null ? entity.getUtilisateur().getId() : null);
        return dto;
    }

    private Patient toEntity(PatientDto dto) {
        return Patient.builder()
                .numeroDossier(dto.getNumeroDossier())
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .dateNaissance(dto.getDateNaissance())
                .sexe(dto.getSexe())
                .telephone(dto.getTelephone())
                .adresse(dto.getAdresse())
                .groupeSanguin(dto.getGroupeSanguin())
                .allergies(dto.getAllergies())
                .antecedents(dto.getAntecedents())
                .utilisateur(dto.getUtilisateurId() != null
                        ? utilisateurRepository.findById(dto.getUtilisateurId()).orElse(null)
                        : null)
                .build();
    }
}
