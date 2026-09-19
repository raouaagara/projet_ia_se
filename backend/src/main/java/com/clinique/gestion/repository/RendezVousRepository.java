package com.clinique.gestion.repository;

import com.clinique.gestion.entity.RendezVous;
import com.clinique.gestion.entity.StatutRendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByPatientIdOrderByDateHeureDesc(Long patientId);
    List<RendezVous> findByMedecinIdOrderByDateHeureAsc(Long medecinId);
    long countByStatut(StatutRendezVous statut);

    @Query("SELECT r FROM RendezVous r WHERE r.dateHeure >= :from AND r.dateHeure < :to ORDER BY r.dateHeure ASC")
    List<RendezVous> findByDateHeureBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT r.medecin.nom, COUNT(r) FROM RendezVous r GROUP BY r.medecin.id, r.medecin.nom ORDER BY COUNT(r) DESC")
    List<Object[]> countByMedecin();
}
