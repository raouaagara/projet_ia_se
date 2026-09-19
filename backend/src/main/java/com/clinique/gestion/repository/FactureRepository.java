package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Facture;
import com.clinique.gestion.entity.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FactureRepository extends JpaRepository<Facture, Long> {

    List<Facture> findByPatientIdOrderByDateFactureDesc(Long patientId);
    List<Facture> findByStatutOrderByDateFactureDesc(StatutPaiement statut);
    Optional<Facture> findByConsultationId(Long consultationId);
    Optional<Facture> findByNumeroFacture(String numeroFacture);

    @Query("SELECT SUM(f.montantTotal) FROM Facture f WHERE f.statut = 'PAYE' AND f.dateFacture BETWEEN :debut AND :fin")
    BigDecimal sumRevenusPeriode(LocalDate debut, LocalDate fin);

    @Query("SELECT SUM(f.montantTotal) FROM Facture f WHERE f.statut = 'PAYE'")
    BigDecimal sumRevenusTotal();

    long countByStatut(StatutPaiement statut);

    @Query("SELECT f FROM Facture f ORDER BY f.dateCreation DESC")
    List<Facture> findAllOrderByDateCreationDesc();
}
