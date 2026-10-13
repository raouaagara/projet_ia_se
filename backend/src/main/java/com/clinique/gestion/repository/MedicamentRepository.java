package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MedicamentRepository extends JpaRepository<Medicament, Long> {
    Optional<Medicament> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT m FROM Medicament m WHERE LOWER(m.nomCommercial) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "OR LOWER(m.dci) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(m.code) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "ORDER BY m.nomCommercial")
    List<Medicament> rechercher(String q);

    List<Medicament> findAllByOrderByNomCommercialAsc();
}
