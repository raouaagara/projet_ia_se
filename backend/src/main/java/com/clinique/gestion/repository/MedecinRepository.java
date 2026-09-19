package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByUtilisateurId(Long utilisateurId);
    List<Medecin> findBySpecialiteContainingIgnoreCase(String specialite);
    long countByDisponibleTrue();
}
