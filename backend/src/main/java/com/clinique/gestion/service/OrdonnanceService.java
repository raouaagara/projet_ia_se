package com.clinique.gestion.service;

import com.clinique.gestion.dto.LigneOrdonnanceDto;
import com.clinique.gestion.dto.OrdonnanceDto;
import com.clinique.gestion.entity.Consultation;
import com.clinique.gestion.entity.LigneOrdonnance;
import com.clinique.gestion.entity.Medicament;
import com.clinique.gestion.entity.Ordonnance;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.StatutDelivrance;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.LotMedicamentRepository;
import com.clinique.gestion.repository.MedecinRepository;
import com.clinique.gestion.repository.MedicamentRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrdonnanceService {

    private final OrdonnanceRepository repository;
    private final ConsultationRepository consultationRepository;
    private final MedicamentRepository medicamentRepository;
    private final MedecinRepository medecinRepository;
    private final LotMedicamentRepository lotRepository;
    private final NotificationService notificationService;
    private final UtilisateurCourant utilisateurCourant;

    /** Un médecin ne voit que ses ordonnances ; l'administration et le secrétariat voient tout. */
    @Transactional(readOnly = true)
    public List<OrdonnanceDto> findAll() {
        Optional<Utilisateur> u = utilisateurCourant.get();
        if (u.isPresent() && u.get().getRole() == Role.MEDECIN) {
            return medecinRepository.findByUtilisateurId(u.get().getId())
                    .map(m -> repository.findByConsultationMedecinIdOrderByDateEmissionDescIdDesc(m.getId()))
                    .orElse(List.of())
                    .stream().map(o -> toDto(o, true)).toList();
        }
        return repository.findAllByOrderByDateEmissionDescIdDesc().stream().map(o -> toDto(o, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<OrdonnanceDto> findByPatient(Long patientId) {
        utilisateurCourant.verifierAccesPatient(patientId);
        return repository.findByConsultationPatientIdOrderByDateEmissionDesc(patientId).stream()
                .map(o -> toDto(o, false)).toList();
    }

    @Transactional(readOnly = true)
    public OrdonnanceDto findById(Long id) {
        Ordonnance o = get(id);
        utilisateurCourant.verifierAccesPatient(o.getConsultation().getPatient().getId());
        return toDto(o, true);
    }

    @Transactional
    public OrdonnanceDto create(OrdonnanceDto dto) {
        Consultation consultation = consultation(dto.getConsultationId());
        verifierMedecinTraitant(consultation);

        Ordonnance entity = Ordonnance.builder()
                .consultation(consultation)
                .dateEmission(dto.getDateEmission() != null ? dto.getDateEmission() : LocalDate.now())
                .posologie(dto.getPosologie())
                .instructions(dto.getInstructions())
                .build();
        appliquerLignes(entity, dto);
        Ordonnance saved = repository.save(entity);

        if (saved.getConsultation().getPatient().getUtilisateur() != null) {
            String nomMedecin = saved.getConsultation().getMedecin().getPrenom()
                    + " " + saved.getConsultation().getMedecin().getNom();
            notificationService.envoyerNouvellePrescription(
                    saved.getConsultation().getPatient().getUtilisateur(), nomMedecin, saved.getId());
        }
        return toDto(saved, true);
    }

    @Transactional
    public OrdonnanceDto update(Long id, OrdonnanceDto dto) {
        Ordonnance existing = get(id);
        verifierNonDelivree(existing);
        Consultation consultation = consultation(dto.getConsultationId());
        verifierMedecinTraitant(consultation);
        existing.setConsultation(consultation);
        existing.setPosologie(dto.getPosologie());
        existing.setInstructions(dto.getInstructions());
        if (dto.getDateEmission() != null) {
            existing.setDateEmission(dto.getDateEmission());
        }
        appliquerLignes(existing, dto);
        return toDto(repository.save(existing), true);
    }

    @Transactional
    public void delete(Long id) {
        Ordonnance existing = get(id);
        verifierNonDelivree(existing);
        repository.delete(existing);
    }

    // ── Règles métier ─────────────────────────────────────────────────────

    private void appliquerLignes(Ordonnance ordonnance, OrdonnanceDto dto) {
        ordonnance.getLignes().clear();
        if (dto.getLignes() != null) {
            for (LigneOrdonnanceDto l : dto.getLignes()) {
                Medicament m = medicamentRepository.findById(l.getMedicamentId())
                        .orElseThrow(() -> new IllegalArgumentException("Médicament introuvable"));
                if (!m.isActif()) {
                    throw new IllegalArgumentException("Le médicament « " + m.libelle() + " » n'est plus référencé.");
                }
                ordonnance.getLignes().add(LigneOrdonnance.builder()
                        .ordonnance(ordonnance)
                        .medicament(m)
                        .posologie(l.getPosologie())
                        .dureeJours(l.getDureeJours())
                        .quantite(Math.max(1, l.getQuantite()))
                        .build());
            }
        }
        if (ordonnance.getLignes().isEmpty()) {
            if (dto.getMedicaments() == null || dto.getMedicaments().isBlank()) {
                throw new IllegalArgumentException("Ajoutez au moins un médicament à l'ordonnance.");
            }
            ordonnance.setMedicaments(dto.getMedicaments().trim());
            ordonnance.setStatutDelivrance(null);
        } else {
            ordonnance.setMedicaments(resume(ordonnance.getLignes()));
            ordonnance.setStatutDelivrance(StatutDelivrance.NON_DELIVREE);
        }
    }

    /** Texte lisible de l'ordonnance, conservé pour l'historique et les écrans existants. */
    private String resume(List<LigneOrdonnance> lignes) {
        return lignes.stream().map(l -> {
            StringBuilder sb = new StringBuilder(l.getMedicament().libelle());
            if (l.getPosologie() != null && !l.getPosologie().isBlank()) sb.append(" — ").append(l.getPosologie());
            if (l.getDureeJours() != null) sb.append(" pendant ").append(l.getDureeJours()).append(" jour(s)");
            sb.append(" — quantité : ").append(l.getQuantite());
            return sb.toString();
        }).collect(Collectors.joining("\n"));
    }

    private void verifierNonDelivree(Ordonnance o) {
        if (o.getStatutDelivrance() == StatutDelivrance.PARTIELLE || o.getStatutDelivrance() == StatutDelivrance.COMPLETE) {
            throw new IllegalStateException("Cette ordonnance a déjà été délivrée par la pharmacie : elle ne peut plus être modifiée ni supprimée.");
        }
    }

    /** Un médecin ne peut prescrire que dans le cadre de ses propres consultations. */
    private void verifierMedecinTraitant(Consultation consultation) {
        Optional<Utilisateur> u = utilisateurCourant.get();
        if (u.isPresent() && u.get().getRole() == Role.MEDECIN) {
            Utilisateur medecinUser = consultation.getMedecin().getUtilisateur();
            if (medecinUser == null || !medecinUser.getId().equals(u.get().getId())) {
                throw new AccessDeniedException("Consultation d'un autre médecin");
            }
        }
    }

    private Ordonnance get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable"));
    }

    private Consultation consultation(Long id) {
        return consultationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Consultation introuvable"));
    }

    public OrdonnanceDto toDto(Ordonnance entity, boolean avecStock) {
        OrdonnanceDto dto = new OrdonnanceDto();
        dto.setId(entity.getId());
        dto.setConsultationId(entity.getConsultation().getId());
        dto.setDateEmission(entity.getDateEmission());
        dto.setMedicaments(entity.getMedicaments());
        dto.setPosologie(entity.getPosologie());
        dto.setInstructions(entity.getInstructions());
        dto.setStatutDelivrance(entity.getStatutDelivrance());
        dto.setPatientId(entity.getConsultation().getPatient().getId());
        dto.setPatientNom(entity.getConsultation().getPatient().getPrenom() + " " + entity.getConsultation().getPatient().getNom());
        dto.setNumeroDossier(entity.getConsultation().getPatient().getNumeroDossier());
        dto.setMedecinId(entity.getConsultation().getMedecin().getId());
        dto.setMedecinNom("Dr " + entity.getConsultation().getMedecin().getPrenom() + " " + entity.getConsultation().getMedecin().getNom());
        LocalDate today = LocalDate.now();
        dto.setLignes(entity.getLignes().stream().map(l -> {
            LigneOrdonnanceDto ld = new LigneOrdonnanceDto();
            ld.setId(l.getId());
            ld.setMedicamentId(l.getMedicament().getId());
            ld.setMedicamentNom(l.getMedicament().libelle());
            ld.setPosologie(l.getPosologie());
            ld.setDureeJours(l.getDureeJours());
            ld.setQuantite(l.getQuantite());
            ld.setQuantiteDelivree(l.getQuantiteDelivree());
            ld.setResteADelivrer(l.resteADelivrer());
            if (avecStock) {
                ld.setStockDisponible(lotRepository.stockDisponible(l.getMedicament().getId(), today));
            }
            return ld;
        }).toList());
        return dto;
    }
}
