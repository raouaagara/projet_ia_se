package com.clinique.gestion.repository;

import com.clinique.gestion.entity.LotMedicament;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface LotMedicamentRepository extends JpaRepository<LotMedicament, Long> {

    List<LotMedicament> findByMedicamentIdOrderByDatePeremptionAsc(Long medicamentId);

    List<LotMedicament> findAllByOrderByDatePeremptionAsc();

    /** Lots utilisables pour une délivrance, du plus proche de la péremption au plus lointain (FEFO). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LotMedicament l WHERE l.medicament.id = :medicamentId AND l.quantiteRestante > 0 "
         + "AND l.datePeremption >= :aujourdhui ORDER BY l.datePeremption ASC, l.id ASC")
    List<LotMedicament> lotsDisponiblesFefo(Long medicamentId, LocalDate aujourdhui);

    @Query("SELECT COALESCE(SUM(l.quantiteRestante), 0) FROM LotMedicament l WHERE l.medicament.id = :medicamentId "
         + "AND l.datePeremption >= :aujourdhui")
    long stockDisponible(Long medicamentId, LocalDate aujourdhui);
}
