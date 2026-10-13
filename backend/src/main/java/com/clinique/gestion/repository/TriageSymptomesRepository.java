package com.clinique.gestion.repository;

import com.clinique.gestion.entity.TriageSymptomes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TriageSymptomesRepository extends JpaRepository<TriageSymptomes, Long> {
    List<TriageSymptomes> findTop20ByPatientIdOrderByDateTriageDesc(Long patientId);
}
