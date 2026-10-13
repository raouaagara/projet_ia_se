package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Ordonnance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    List<Ordonnance> findByConsultationPatientIdOrderByDateEmissionDesc(Long patientId);

    List<Ordonnance> findByConsultationMedecinIdOrderByDateEmissionDescIdDesc(Long medecinId);

    List<Ordonnance> findAllByOrderByDateEmissionDescIdDesc();

    /** Ordonnances structurées qui restent à délivrer (totalement ou en partie). */
    @Query("SELECT DISTINCT o FROM Ordonnance o JOIN o.lignes l "
         + "WHERE o.statutDelivrance IS NULL OR o.statutDelivrance <> com.clinique.gestion.entity.StatutDelivrance.COMPLETE "
         + "ORDER BY o.dateEmission DESC, o.id DESC")
    List<Ordonnance> aDelivrer();
}
