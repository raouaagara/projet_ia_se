package com.clinique.gestion.service;

import com.clinique.gestion.dto.ExamenDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamenService {

    private final ExamenLaboratoireRepository examenRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ConsultationRepository consultationRepository;
    private final NotificationService notificationService;

    public List<ExamenDto> findAll() {
        return examenRepository.findAll().stream()
            .sorted((a, b) -> b.getDateCreation().compareTo(a.getDateCreation()))
            .map(this::toDto).collect(Collectors.toList());
    }

    public List<ExamenDto> findByPatient(Long patientId) {
        return examenRepository.findByPatientIdOrderByDateDemandeDesc(patientId)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ExamenDto> findByMedecin(Long medecinId) {
        return examenRepository.findByMedecinIdOrderByDateDemandeDesc(medecinId)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ExamenDto findById(Long id) {
        return toDto(get(id));
    }

    @Transactional
    public ExamenDto create(ExamenDto dto) {
        ExamenLaboratoire e = new ExamenLaboratoire();
        e.setPatient(patientRepository.findById(dto.getPatientId())
            .orElseThrow(() -> new IllegalArgumentException("Patient introuvable")));
        e.setMedecin(medecinRepository.findById(dto.getMedecinId())
            .orElseThrow(() -> new IllegalArgumentException("Médecin introuvable")));
        e.setTypeExamen(dto.getTypeExamen());
        e.setDescription(dto.getDescription());
        e.setStatut(StatutExamen.DEMANDE);
        e.setNotes(dto.getNotes());
        if (dto.getConsultationId() != null)
            consultationRepository.findById(dto.getConsultationId()).ifPresent(e::setConsultation);
        return toDto(examenRepository.save(e));
    }

    @Transactional
    public ExamenDto saisirResultat(Long id, String resultat, String fichier) {
        ExamenLaboratoire e = get(id);
        e.setResultatTexte(resultat);
        e.setFichierResultat(fichier);
        e.setDateResultat(LocalDate.now());
        e.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
        ExamenLaboratoire saved = examenRepository.save(e);

        // Notifier le patient
        if (saved.getPatient().getUtilisateur() != null) {
            notificationService.creer(
                saved.getPatient().getUtilisateur().getId(),
                "Résultat d'examen disponible",
                "Les résultats de votre examen '" + saved.getTypeExamen() + "' sont disponibles.",
                TypeNotification.RESULTAT_DISPONIBLE, saved.getId(), "EXAMEN"
            );
        }
        return toDto(saved);
    }

    @Transactional
    public ExamenDto updateStatut(Long id, StatutExamen statut) {
        ExamenLaboratoire e = get(id);
        e.setStatut(statut);
        return toDto(examenRepository.save(e));
    }

    public void delete(Long id) { examenRepository.deleteById(id); }

    private ExamenLaboratoire get(Long id) {
        return examenRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Examen introuvable"));
    }

    private ExamenDto toDto(ExamenLaboratoire e) {
        ExamenDto dto = new ExamenDto();
        dto.setId(e.getId());
        dto.setPatientId(e.getPatient().getId());
        dto.setPatientNom(e.getPatient().getPrenom() + " " + e.getPatient().getNom());
        dto.setMedecinId(e.getMedecin().getId());
        dto.setMedecinNom("Dr " + e.getMedecin().getPrenom() + " " + e.getMedecin().getNom());
        if (e.getConsultation() != null) dto.setConsultationId(e.getConsultation().getId());
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
