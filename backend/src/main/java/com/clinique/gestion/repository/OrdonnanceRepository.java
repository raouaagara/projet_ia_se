package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Ordonnance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    List<Ordonnance> findByConsultationPatientIdOrderByDateEmissionDesc(Long patientId);
}
