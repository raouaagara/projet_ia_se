package com.clinique.gestion.service;

import com.clinique.gestion.dto.FactureDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FactureService {

    private final FactureRepository factureRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ConsultationRepository consultationRepository;
    private final NotificationService notificationService;

    public List<FactureDto> findAll() {
        return factureRepository.findAllOrderByDateCreationDesc().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<FactureDto> findByPatient(Long patientId) {
        return factureRepository.findByPatientIdOrderByDateFactureDesc(patientId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public FactureDto findById(Long id) {
        return toDto(get(id));
    }

    @Transactional
    public FactureDto create(FactureDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
            .orElseThrow(() -> new IllegalArgumentException("Patient introuvable"));

        Facture facture = new Facture();
        facture.setNumeroFacture(genererNumero());
        facture.setPatient(patient);
        facture.setDateFacture(dto.getDateFacture() != null ? dto.getDateFacture() : LocalDate.now());
        facture.setStatut(StatutPaiement.EN_ATTENTE);
        facture.setMontantPaye(BigDecimal.ZERO);
        facture.setNotes(dto.getNotes());

        if (dto.getMedecinId() != null) {
            medecinRepository.findById(dto.getMedecinId()).ifPresent(facture::setMedecin);
        }
        if (dto.getConsultationId() != null) {
            consultationRepository.findById(dto.getConsultationId()).ifPresent(facture::setConsultation);
        }

        // Lignes
        if (dto.getLignes() != null && !dto.getLignes().isEmpty()) {
            BigDecimal total = BigDecimal.ZERO;
            for (FactureDto.LigneFactureDto l : dto.getLignes()) {
                LigneFacture ligne = new LigneFacture();
                ligne.setFacture(facture);
                ligne.setDescription(l.getDescription());
                ligne.setQuantite(l.getQuantite() != null ? l.getQuantite() : 1);
                ligne.setPrixUnitaire(l.getPrixUnitaire());
                ligne.calculerTotal();
                facture.getLignes().add(ligne);
                total = total.add(ligne.getTotal());
            }
            facture.setMontantTotal(total);
        } else {
            facture.setMontantTotal(dto.getMontantTotal() != null ? dto.getMontantTotal() : BigDecimal.ZERO);
        }

        Facture saved = factureRepository.save(facture);

        // Notifier le patient
        if (patient.getUtilisateur() != null) {
            notificationService.creer(
                patient.getUtilisateur().getId(),
                "Nouvelle facture",
                "Une facture de " + saved.getMontantTotal() + " DA a été générée. N° " + saved.getNumeroFacture(),
                TypeNotification.FACTURE_GENEREE,
                saved.getId(), "FACTURE"
            );
        }

        return toDto(saved);
    }

    @Transactional
    public FactureDto updatePaiement(Long id, BigDecimal montantPaye, StatutPaiement statut) {
        Facture facture = get(id);
        facture.setMontantPaye(montantPaye);
        facture.setStatut(statut);
        return toDto(factureRepository.save(facture));
    }

    @Transactional
    public FactureDto update(Long id, FactureDto dto) {
        Facture f = get(id);
        f.setNotes(dto.getNotes());
        if (dto.getStatut() != null) f.setStatut(dto.getStatut());
        if (dto.getMontantPaye() != null) f.setMontantPaye(dto.getMontantPaye());
        if (dto.getMontantTotal() != null) f.setMontantTotal(dto.getMontantTotal());
        return toDto(factureRepository.save(f));
    }

    public void delete(Long id) {
        factureRepository.deleteById(id);
    }

    public Object stats() {
        BigDecimal revenusTotal = factureRepository.sumRevenusTotal();
        long impayees = factureRepository.countByStatut(StatutPaiement.EN_ATTENTE);
        long payees   = factureRepository.countByStatut(StatutPaiement.PAYE);
        return java.util.Map.of(
            "revenusTotal",   revenusTotal != null ? revenusTotal : BigDecimal.ZERO,
            "facturesPayees", payees,
            "facturesImpayees", impayees,
            "total", factureRepository.count()
        );
    }

    private String genererNumero() {
        String annee = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));
        long count = factureRepository.count() + 1;
        return String.format("FAC-%s-%04d", annee, count);
    }

    private Facture get(Long id) {
        return factureRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Facture introuvable"));
    }

    private FactureDto toDto(Facture f) {
        FactureDto dto = new FactureDto();
        dto.setId(f.getId());
        dto.setNumeroFacture(f.getNumeroFacture());
        dto.setPatientId(f.getPatient().getId());
        dto.setPatientNom(f.getPatient().getPrenom() + " " + f.getPatient().getNom());
        if (f.getMedecin() != null) {
            dto.setMedecinId(f.getMedecin().getId());
            dto.setMedecinNom("Dr " + f.getMedecin().getPrenom() + " " + f.getMedecin().getNom());
        }
        if (f.getConsultation() != null) dto.setConsultationId(f.getConsultation().getId());
        dto.setDateFacture(f.getDateFacture());
        dto.setMontantTotal(f.getMontantTotal());
        dto.setMontantPaye(f.getMontantPaye());
        dto.setStatut(f.getStatut());
        dto.setNotes(f.getNotes());
        dto.setDateCreation(f.getDateCreation());
        dto.setLignes(f.getLignes().stream().map(l -> {
            FactureDto.LigneFactureDto ld = new FactureDto.LigneFactureDto();
            ld.setId(l.getId());
            ld.setDescription(l.getDescription());
            ld.setQuantite(l.getQuantite());
            ld.setPrixUnitaire(l.getPrixUnitaire());
            ld.setTotal(l.getTotal());
            return ld;
        }).collect(Collectors.toList()));
        return dto;
    }
}
