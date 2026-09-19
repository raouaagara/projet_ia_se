package com.clinique.gestion.service;

import com.clinique.gestion.dto.ConsultationDto;
import com.clinique.gestion.entity.Consultation;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.MedecinRepository;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository repository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;

    public List<ConsultationDto> findAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public List<ConsultationDto> findByPatient(Long patientId) {
        return repository.findByPatientIdOrderByDateConsultationDesc(patientId).stream().map(this::toDto).toList();
    }

    public List<ConsultationDto> findByMedecin(Long medecinId) {
        return repository.findByMedecinIdOrderByDateConsultationDesc(medecinId).stream().map(this::toDto).toList();
    }

    public ConsultationDto findById(Long id) {
        return toDto(get(id));
    }

    public ConsultationDto create(ConsultationDto dto) {
        Consultation entity = toEntity(dto);
        entity.setId(null);
        if (entity.getDateConsultation() == null) {
            entity.setDateConsultation(LocalDateTime.now());
        }
        return toDto(repository.save(entity));
    }

    public ConsultationDto update(Long id, ConsultationDto dto) {
        Consultation existing = get(id);
        existing.setDiagnostic(dto.getDiagnostic());
        existing.setObservations(dto.getObservations());
        existing.setTraitement(dto.getTraitement());
        existing.setDateConsultation(dto.getDateConsultation() == null ? existing.getDateConsultation() : dto.getDateConsultation());
        existing.setPatient(patientRepository.findById(dto.getPatientId()).orElse(existing.getPatient()));
        existing.setMedecin(medecinRepository.findById(dto.getMedecinId()).orElse(existing.getMedecin()));
        if (dto.getRendezVousId() != null) {
            existing.setRendezVous(rendezVousRepository.findById(dto.getRendezVousId()).orElse(null));
        }
        return toDto(repository.save(existing));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private Consultation get(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Consultation introuvable"));
    }

    private ConsultationDto toDto(Consultation entity) {
        ConsultationDto dto = new ConsultationDto();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatient().getId());
        dto.setMedecinId(entity.getMedecin().getId());
        dto.setRendezVousId(entity.getRendezVous() != null ? entity.getRendezVous().getId() : null);
        dto.setDateConsultation(entity.getDateConsultation());
        dto.setDiagnostic(entity.getDiagnostic());
        dto.setObservations(entity.getObservations());
        dto.setTraitement(entity.getTraitement());
        dto.setPatientNom(entity.getPatient().getPrenom() + " " + entity.getPatient().getNom());
        dto.setMedecinNom("Dr " + entity.getMedecin().getPrenom() + " " + entity.getMedecin().getNom());
        return dto;
    }

    private Consultation toEntity(ConsultationDto dto) {
        return Consultation.builder()
                .patient(patientRepository.findById(dto.getPatientId()).orElseThrow())
                .medecin(medecinRepository.findById(dto.getMedecinId()).orElseThrow())
                .rendezVous(dto.getRendezVousId() != null ? rendezVousRepository.findById(dto.getRendezVousId()).orElse(null) : null)
                .dateConsultation(dto.getDateConsultation())
                .diagnostic(dto.getDiagnostic())
                .observations(dto.getObservations())
                .traitement(dto.getTraitement())
                .build();
    }
}
