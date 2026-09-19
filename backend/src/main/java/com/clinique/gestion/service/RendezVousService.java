package com.clinique.gestion.service;

import com.clinique.gestion.dto.RendezVousDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository       repository;
    private final PatientRepository          patientRepository;
    private final MedecinRepository          medecinRepository;
    private final NotificationService        notificationService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");

    public List<RendezVousDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public List<RendezVousDto> findByPatient(Long patientId) {
        return repository.findByPatientIdOrderByDateHeureDesc(patientId).stream().map(this::toDto).toList();
    }

    public List<RendezVousDto> findByMedecin(Long medecinId) {
        return repository.findByMedecinIdOrderByDateHeureAsc(medecinId).stream().map(this::toDto).toList();
    }

    public RendezVousDto findById(Long id) {
        return toDto(get(id));
    }

    public RendezVousDto create(RendezVousDto dto) {
        RendezVous entity = toEntity(dto);
        entity.setId(null);
        if (entity.getStatut() == null) entity.setStatut(StatutRendezVous.PLANIFIE);
        RendezVous saved = repository.save(entity);

        String dateStr = saved.getDateHeure() != null ? saved.getDateHeure().format(FMT) : "";
        String patientNom = saved.getPatient().getPrenom() + " " + saved.getPatient().getNom();
        String medecinNom = "Dr " + saved.getMedecin().getPrenom() + " " + saved.getMedecin().getNom();

        // ── Notifier le MÉDECIN : nouveau RDV reçu ──
        if (saved.getMedecin().getUtilisateur() != null) {
            try {
                notificationService.creer(
                    saved.getMedecin().getUtilisateur().getId(),
                    "🗓️ Nouveau rendez-vous",
                    "Le patient " + patientNom + " a pris un rendez-vous le " + dateStr
                        + (saved.getMotif() != null && !saved.getMotif().isBlank()
                           ? " — Motif : " + saved.getMotif() : ""),
                    TypeNotification.RAPPEL_RDV, saved.getId(), "RDV"
                );
            } catch (Exception e) {
                // Ne pas bloquer la création du RDV si la notification échoue
            }
        }

        // ── Notifier le PATIENT : RDV enregistré ──
        if (saved.getPatient().getUtilisateur() != null) {
            try {
                notificationService.creer(
                    saved.getPatient().getUtilisateur().getId(),
                    "📅 Rendez-vous enregistré",
                    "Votre rendez-vous avec " + medecinNom + " est planifié pour le " + dateStr + ". En attente de confirmation.",
                    TypeNotification.RDV_CONFIRME, saved.getId(), "RDV"
                );
            } catch (Exception e) {
                // Ne pas bloquer la création du RDV si la notification échoue
            }
        }

        return toDto(saved);
    }

    public RendezVousDto update(Long id, RendezVousDto dto) {
        RendezVous existing = get(id);
        StatutRendezVous ancienStatut = existing.getStatut();

        existing.setPatient(patient(dto.getPatientId()));
        existing.setMedecin(medecin(dto.getMedecinId()));
        existing.setDateHeure(dto.getDateHeure());
        existing.setMotif(dto.getMotif());
        existing.setStatut(dto.getStatut() == null ? existing.getStatut() : dto.getStatut());
        existing.setNotes(dto.getNotes());
        RendezVous saved = repository.save(existing);

        StatutRendezVous nouveauStatut = saved.getStatut();
        String dateStr   = saved.getDateHeure() != null ? saved.getDateHeure().format(FMT) : "";
        String medecinNom = "Dr " + saved.getMedecin().getPrenom() + " " + saved.getMedecin().getNom();
        String patientNom = saved.getPatient().getPrenom() + " " + saved.getPatient().getNom();

        // ── Statut changé → CONFIRME ──
        if (ancienStatut != StatutRendezVous.CONFIRME && nouveauStatut == StatutRendezVous.CONFIRME) {
            if (saved.getPatient().getUtilisateur() != null) {
                try { notificationService.creer(saved.getPatient().getUtilisateur().getId(),
                    "🎉 Rendez-vous confirmé",
                    medecinNom + " a confirmé votre rendez-vous du " + dateStr + ".",
                    TypeNotification.RDV_CONFIRME, saved.getId(), "RDV");
                } catch (Exception ignored) {}
            }
            if (saved.getMedecin().getUtilisateur() != null) {
                try { notificationService.creer(saved.getMedecin().getUtilisateur().getId(),
                    "✅ RDV confirmé",
                    "Vous avez confirmé le rendez-vous avec " + patientNom + " pour le " + dateStr + ".",
                    TypeNotification.RDV_CONFIRME, saved.getId(), "RDV");
                } catch (Exception ignored) {}
            }
        }

        // ── Statut changé → ANNULE ──
        if (ancienStatut != StatutRendezVous.ANNULE && nouveauStatut == StatutRendezVous.ANNULE) {
            if (saved.getPatient().getUtilisateur() != null) {
                try { notificationService.creer(saved.getPatient().getUtilisateur().getId(),
                    "❌ Rendez-vous annulé",
                    "Votre rendez-vous avec " + medecinNom + " du " + dateStr + " a été annulé.",
                    TypeNotification.RDV_ANNULE, saved.getId(), "RDV");
                } catch (Exception ignored) {}
            }
            if (saved.getMedecin().getUtilisateur() != null) {
                try { notificationService.creer(saved.getMedecin().getUtilisateur().getId(),
                    "❌ RDV annulé",
                    "Le rendez-vous avec " + patientNom + " du " + dateStr + " a été annulé.",
                    TypeNotification.RDV_ANNULE, saved.getId(), "RDV");
                } catch (Exception ignored) {}
            }
        }

        return toDto(saved);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private RendezVous get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Rendez-vous introuvable"));
    }

    private Patient patient(Long id) {
        return patientRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Patient introuvable"));
    }

    private Medecin medecin(Long id) {
        return medecinRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Médecin introuvable"));
    }

    private RendezVousDto toDto(RendezVous entity) {
        RendezVousDto dto = new RendezVousDto();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatient().getId());
        dto.setMedecinId(entity.getMedecin().getId());
        dto.setDateHeure(entity.getDateHeure());
        dto.setMotif(entity.getMotif());
        dto.setStatut(entity.getStatut());
        dto.setNotes(entity.getNotes());
        dto.setPatientNom(entity.getPatient().getPrenom() + " " + entity.getPatient().getNom());
        dto.setMedecinNom("Dr " + entity.getMedecin().getPrenom() + " " + entity.getMedecin().getNom());
        dto.setSpecialite(entity.getMedecin().getSpecialite());
        return dto;
    }

    private RendezVous toEntity(RendezVousDto dto) {
        return RendezVous.builder()
                .patient(patient(dto.getPatientId()))
                .medecin(medecin(dto.getMedecinId()))
                .dateHeure(dto.getDateHeure())
                .motif(dto.getMotif())
                .statut(dto.getStatut())
                .notes(dto.getNotes())
                .build();
    }
}
