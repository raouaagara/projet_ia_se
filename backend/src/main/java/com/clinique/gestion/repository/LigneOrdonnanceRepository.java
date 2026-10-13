package com.clinique.gestion.repository;

import com.clinique.gestion.entity.LigneOrdonnance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LigneOrdonnanceRepository extends JpaRepository<LigneOrdonnance, Long> {
    boolean existsByMedicamentId(Long medicamentId);
}
