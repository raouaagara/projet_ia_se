package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByPatientIdOrderByDateConsultationDesc(Long patientId);
    List<Consultation> findByMedecinIdOrderByDateConsultationDesc(Long medecinId);
}
