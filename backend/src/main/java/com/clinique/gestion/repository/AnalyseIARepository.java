package com.clinique.gestion.repository;

import com.clinique.gestion.entity.AnalyseIA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnalyseIARepository extends JpaRepository<AnalyseIA, Long> {
    List<AnalyseIA> findTop20ByPatientIdOrderByDateGenerationDesc(Long patientId);
    List<AnalyseIA> findTop5ByExamenIdOrderByDateGenerationDesc(Long examenId);
}
