package com.clinique.gestion.service;

import com.clinique.gestion.dto.OrdonnanceDto;
import com.clinique.gestion.entity.Consultation;
import com.clinique.gestion.entity.Ordonnance;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdonnanceService {

    private final OrdonnanceRepository repository;
    private final ConsultationRepository consultationRepository;
    private final NotificationService notificationService;

    public List<OrdonnanceDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public List<OrdonnanceDto> findByPatient(Long patientId) {
        return repository.findByConsultationPatientIdOrderByDateEmissionDesc(patientId).stream().map(this::toDto).toList();
    }

    public OrdonnanceDto findById(Long id) {
        return toDto(get(id));
    }

    public OrdonnanceDto create(OrdonnanceDto dto) {
        Ordonnance entity = toEntity(dto);
        entity.setId(null);
        if (entity.getDateEmission() == null) {
            entity.setDateEmission(LocalDate.now());
        }
        Ordonnance saved = repository.save(entity);

        // Notifier le patient
        if (saved.getConsultation().getPatient().getUtilisateur() != null) {
            String nomMedecin = saved.getConsultation().getMedecin().getPrenom()
                    + " " + saved.getConsultation().getMedecin().getNom();
            notificationService.envoyerNouvellePrescription(
                    saved.getConsultation().getPatient().getUtilisateur(),
                    nomMedecin, saved.getId());
        }

        return toDto(saved);
    }

    public OrdonnanceDto update(Long id, OrdonnanceDto dto) {
        Ordonnance existing = get(id);
        existing.setMedicaments(dto.getMedicaments());
        existing.setPosologie(dto.getPosologie());
        existing.setInstructions(dto.getInstructions());
        existing.setDateEmission(dto.getDateEmission() == null ? existing.getDateEmission() : dto.getDateEmission());
        existing.setConsultation(consultation(dto.getConsultationId()));
        return toDto(repository.save(existing));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private Ordonnance get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable"));
    }

    private Consultation consultation(Long id) {
        return consultationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Consultation introuvable"));
    }

    private OrdonnanceDto toDto(Ordonnance entity) {
        OrdonnanceDto dto = new OrdonnanceDto();
        dto.setId(entity.getId());
        dto.setConsultationId(entity.getConsultation().getId());
        dto.setDateEmission(entity.getDateEmission());
        dto.setMedicaments(entity.getMedicaments());
        dto.setPosologie(entity.getPosologie());
        dto.setInstructions(entity.getInstructions());
        dto.setPatientNom(entity.getConsultation().getPatient().getPrenom() + " " + entity.getConsultation().getPatient().getNom());
        dto.setMedecinNom("Dr " + entity.getConsultation().getMedecin().getPrenom() + " " + entity.getConsultation().getMedecin().getNom());
        return dto;
    }

    private Ordonnance toEntity(OrdonnanceDto dto) {
        return Ordonnance.builder()
                .consultation(consultation(dto.getConsultationId()))
                .dateEmission(dto.getDateEmission())
                .medicaments(dto.getMedicaments())
                .posologie(dto.getPosologie())
                .instructions(dto.getInstructions())
                .build();
    }
}
