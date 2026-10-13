package com.clinique.gestion.repository;

import com.clinique.gestion.entity.MouvementStock;
import com.clinique.gestion.entity.TypeMouvement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {

    List<MouvementStock> findTop300ByOrderByDateMouvementDesc();

    List<MouvementStock> findTop300ByTypeOrderByDateMouvementDesc(TypeMouvement type);

    /** Quantités sorties par médicament depuis une date : [medicamentId, total négatif]. */
    @Query("SELECT m.lot.medicament.id, SUM(m.quantite) FROM MouvementStock m "
         + "WHERE m.type = :type AND m.dateMouvement >= :depuis GROUP BY m.lot.medicament.id")
    List<Object[]> totalParMedicamentDepuis(TypeMouvement type, LocalDateTime depuis);
}
