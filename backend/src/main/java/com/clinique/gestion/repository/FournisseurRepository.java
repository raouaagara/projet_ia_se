package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
    List<Fournisseur> findAllByOrderByNomAsc();
}
