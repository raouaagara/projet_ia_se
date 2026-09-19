package com.clinique.gestion.repository;

import com.clinique.gestion.entity.ExamenLaboratoire;
import com.clinique.gestion.entity.StatutExamen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamenLaboratoireRepository extends JpaRepository<ExamenLaboratoire, Long> {

    List<ExamenLaboratoire> findByPatientIdOrderByDateDemandeDesc(Long patientId);
    List<ExamenLaboratoire> findByMedecinIdOrderByDateDemandeDesc(Long medecinId);
    List<ExamenLaboratoire> findByStatutOrderByDateDemandeDesc(StatutExamen statut);
    List<ExamenLaboratoire> findByConsultationIdOrderByDateDemandeDesc(Long consultationId);
    long countByStatut(StatutExamen statut);
}
