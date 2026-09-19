package com.clinique.gestion.service;

import com.clinique.gestion.dto.ExamenLaboratoireDto;
import com.clinique.gestion.dto.ResultatLaboDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.ExamenLaboratoireRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service dédié à l'espace laboratoire.
 * Publie un résultat et envoie les notifications dans une transaction unique.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LaboService {

    private final ExamenLaboratoireRepository examenRepository;
    private final NotificationService notificationService;

    /**
     * Publie un résultat d'examen :
     * 1. Met à jour l'examen (résultat + statut RESULTAT_DISPONIBLE)
     * 2. Notifie le patient
     * 3. Notifie le médecin prescripteur
     * Tout dans une seule transaction.
     */
    @Transactional
    public ExamenLaboratoireDto publierResultat(ResultatLaboDto dto) {

        ExamenLaboratoire examen = examenRepository.findById(dto.getExamenId())
                .orElseThrow(() -> new IllegalArgumentException("Examen introuvable: " + dto.getExamenId()));

        StatutExamen ancienStatut = examen.getStatut();

        // 1. Mettre à jour l'examen
        examen.setResultatTexte(dto.getResultatTexte());
        examen.setFichierResultat(dto.getFichierResultat());
        examen.setNotes(dto.getNotes());
        examen.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
        examen.setDateResultat(dto.getDateResultat() != null ? dto.getDateResultat() : LocalDate.now());

        ExamenLaboratoire saved = examenRepository.save(examen);

        // 2. Notifier le patient (si nouveau résultat)
        if (ancienStatut != StatutExamen.RESULTAT_DISPONIBLE) {
            if (saved.getPatient().getUtilisateur() != null) {
                notificationService.envoyerResultatDisponible(
                        saved.getPatient().getUtilisateur(),
                        saved.getTypeExamen(),
                        saved.getId());
                log.info("Notification résultat envoyée au patient: {}",
                        saved.getPatient().getUtilisateur().getEmail());
            }

            // 3. Notifier le médecin prescripteur
            if (saved.getMedecin().getUtilisateur() != null) {
                String nomPatient = saved.getPatient().getPrenom() + " " + saved.getPatient().getNom();
                notificationService.envoyerResultatMedecin(
                        saved.getMedecin().getUtilisateur(),
                        nomPatient,
                        saved.getTypeExamen(),
                        saved.getId());
                log.info("Notification résultat envoyée au médecin: {}",
                        saved.getMedecin().getUtilisateur().getEmail());
            }
        }

        return toDto(saved);
    }

    private ExamenLaboratoireDto toDto(ExamenLaboratoire e) {
        ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
        dto.setId(e.getId());
        dto.setPatientId(e.getPatient().getId());
        dto.setPatientNom(e.getPatient().getPrenom() + " " + e.getPatient().getNom());
        dto.setMedecinId(e.getMedecin().getId());
        dto.setMedecinNom("Dr " + e.getMedecin().getPrenom() + " " + e.getMedecin().getNom());
        dto.setConsultationId(e.getConsultation() != null ? e.getConsultation().getId() : null);
        dto.setTypeExamen(e.getTypeExamen());
        dto.setDescription(e.getDescription());
        dto.setStatut(e.getStatut());
        dto.setDateDemande(e.getDateDemande());
        dto.setDateResultat(e.getDateResultat());
        dto.setResultatTexte(e.getResultatTexte());
        dto.setFichierResultat(e.getFichierResultat());
        dto.setNotes(e.getNotes());
        dto.setDateCreation(e.getDateCreation());
        return dto;
    }
}
