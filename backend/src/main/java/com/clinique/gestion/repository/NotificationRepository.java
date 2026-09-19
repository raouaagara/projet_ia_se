package com.clinique.gestion.repository;

import com.clinique.gestion.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);

    List<Notification> findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(Long utilisateurId);

    long countByUtilisateurIdAndLueFalse(Long utilisateurId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lue = true WHERE n.utilisateur.id = :utilisateurId")
    void marquerToutesLues(Long utilisateurId);
}
