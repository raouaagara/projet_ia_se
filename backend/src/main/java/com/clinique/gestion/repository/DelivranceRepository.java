package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Delivrance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DelivranceRepository extends JpaRepository<Delivrance, Long> {
    List<Delivrance> findTop100ByOrderByDateDelivranceDesc();
    List<Delivrance> findByOrdonnanceIdOrderByDateDelivranceDesc(Long ordonnanceId);
    long countByDateDelivranceAfter(LocalDateTime date);
}
