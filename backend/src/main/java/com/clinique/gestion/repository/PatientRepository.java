package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUtilisateurId(Long utilisateurId);
    Optional<Patient> findByNumeroDossier(String numeroDossier);

    @Query("SELECT DISTINCT r.patient FROM RendezVous r WHERE r.medecin.id = :medecinId")
    List<Patient> findPatientsByMedecinId(Long medecinId);
}
