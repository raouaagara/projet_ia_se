package com.clinique.gestion.service;

import com.clinique.gestion.dto.ExamenLaboratoireDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamenLaboratoireService {

    private final ExamenLaboratoireRepository examenRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ConsultationRepository consultationRepository;
    private final NotificationService notificationService;

    // ── Lecture ──────────────────────────────────────────────────────────

    public List<ExamenLaboratoireDto> findAll() {
        return examenRepository.findAll().stream().map(this::toDto).toList();
    }

    public List<ExamenLaboratoireDto> findByPatient(Long patientId) {
        return examenRepository.findByPatientIdOrderByDateDemandeDesc(patientId)
                .stream().map(this::toDto).toList();
    }

    public List<ExamenLaboratoireDto> findByMedecin(Long medecinId) {
        return examenRepository.findByMedecinIdOrderByDateDemandeDesc(medecinId)
                .stream().map(this::toDto).toList();
    }

    public ExamenLaboratoireDto findById(Long id) {
        return toDto(get(id));
    }

    // ── Création ─────────────────────────────────────────────────────────

    public ExamenLaboratoireDto create(ExamenLaboratoireDto dto) {
        ExamenLaboratoire entity = toEntity(dto);
        entity.setId(null);
        return toDto(examenRepository.save(entity));
    }

    // ── Mise à jour ───────────────────────────────────────────────────────

    /**
     * Mise à jour d'un examen selon le rôle appelant.
     * - LABO : peut tout modifier (résultat, statut, champs annexes)
     * - MEDECIN / SECRETAIRE : ne peuvent PAS toucher au résultat si déjà publié
     *   (resultatTexte, fichierResultat, statut → RESULTAT_DISPONIBLE)
     */
    @Transactional
    public ExamenLaboratoireDto update(Long id, ExamenLaboratoireDto dto) {
        return updateWithRole(id, dto, "OTHER");
    }

    @Transactional
    public ExamenLaboratoireDto updateWithRole(Long id, ExamenLaboratoireDto dto, String role) {
        ExamenLaboratoire existing = get(id);
        StatutExamen ancienStatut = existing.getStatut();

        boolean resultatDejaPublie = ancienStatut == StatutExamen.RESULTAT_DISPONIBLE;
        boolean isLaboOrAdmin = "LABO".equals(role) || "ADMIN".equals(role);

        // Champs toujours modifiables (médecin, secrétaire, labo, admin)
        existing.setTypeExamen(dto.getTypeExamen() != null ? dto.getTypeExamen() : existing.getTypeExamen());
        existing.setDescription(dto.getDescription() != null ? dto.getDescription() : existing.getDescription());

        // Mise à jour patient si fourni
        if (dto.getPatientId() != null) {
            patientRepository.findById(dto.getPatientId()).ifPresent(existing::setPatient);
        }
        // Mise à jour date demande si fournie
        if (dto.getDateDemande() != null) {
            existing.setDateDemande(dto.getDateDemande());
        }

        // Champs résultat : uniquement LABO / ADMIN
        if (isLaboOrAdmin) {
            existing.setNotes(dto.getNotes());
            existing.setStatut(dto.getStatut() != null ? dto.getStatut() : existing.getStatut());
            existing.setDateResultat(dto.getDateResultat());
            existing.setResultatTexte(dto.getResultatTexte());
            existing.setFichierResultat(dto.getFichierResultat());
        } else if (!resultatDejaPublie) {
            // Médecin / Secrétaire peuvent changer le statut AVANT publication
            if (dto.getStatut() != null && dto.getStatut() != StatutExamen.RESULTAT_DISPONIBLE) {
                existing.setStatut(dto.getStatut());
            }
            existing.setNotes(dto.getNotes());
        }
        // Si résultat déjà publié et rôle non-labo → on ignore silencieusement les champs résultat

        // Notifications si nouveau résultat disponible
        if (ancienStatut != StatutExamen.RESULTAT_DISPONIBLE
                && existing.getStatut() == StatutExamen.RESULTAT_DISPONIBLE) {
            existing.setDateResultat(existing.getDateResultat() != null ? existing.getDateResultat() : LocalDate.now());
            String nomPatient = existing.getPatient().getPrenom() + " " + existing.getPatient().getNom();
            if (existing.getPatient().getUtilisateur() != null) {
                notificationService.envoyerResultatDisponible(
                        existing.getPatient().getUtilisateur(), existing.getTypeExamen(), existing.getId());
            }
            if (existing.getMedecin().getUtilisateur() != null) {
                notificationService.envoyerResultatMedecin(
                        existing.getMedecin().getUtilisateur(), nomPatient,
                        existing.getTypeExamen(), existing.getId());
            }
        }

        return toDto(examenRepository.save(existing));
    }

    public void delete(Long id) {
        examenRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private ExamenLaboratoire get(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Examen introuvable"));
    }

    private ExamenLaboratoireDto toDto(ExamenLaboratoire entity) {
        ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatient().getId());
        dto.setPatientNom(entity.getPatient().getPrenom() + " " + entity.getPatient().getNom());
        dto.setMedecinId(entity.getMedecin().getId());
        dto.setMedecinNom("Dr " + entity.getMedecin().getPrenom() + " " + entity.getMedecin().getNom());
        dto.setConsultationId(entity.getConsultation() != null ? entity.getConsultation().getId() : null);
        dto.setTypeExamen(entity.getTypeExamen());
        dto.setDescription(entity.getDescription());
        dto.setStatut(entity.getStatut());
        dto.setDateDemande(entity.getDateDemande());
        dto.setDateResultat(entity.getDateResultat());
        dto.setResultatTexte(entity.getResultatTexte());
        dto.setFichierResultat(entity.getFichierResultat());
        dto.setNotes(entity.getNotes());
        dto.setDateCreation(entity.getDateCreation());
        return dto;
    }

    private ExamenLaboratoire toEntity(ExamenLaboratoireDto dto) {
        return ExamenLaboratoire.builder()
                .patient(patientRepository.findById(dto.getPatientId())
                        .orElseThrow(() -> new IllegalArgumentException("Patient introuvable")))
                .medecin(medecinRepository.findById(dto.getMedecinId())
                        .orElseThrow(() -> new IllegalArgumentException("Médecin introuvable")))
                .consultation(dto.getConsultationId() != null
                        ? consultationRepository.findById(dto.getConsultationId()).orElse(null) : null)
                .typeExamen(dto.getTypeExamen())
                .description(dto.getDescription())
                .statut(dto.getStatut() != null ? dto.getStatut() : StatutExamen.DEMANDE)
                .dateDemande(dto.getDateDemande() != null ? dto.getDateDemande() : LocalDate.now())
                .dateResultat(dto.getDateResultat())
                .resultatTexte(dto.getResultatTexte())
                .fichierResultat(dto.getFichierResultat())
                .notes(dto.getNotes())
                .build();
    }
}
