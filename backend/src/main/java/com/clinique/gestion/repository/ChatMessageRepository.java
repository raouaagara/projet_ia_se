package com.clinique.gestion.repository;

import com.clinique.gestion.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /** Tous les messages d'une session, dans l'ordre chronologique */
    List<ChatMessage> findBySessionIdOrderByDateMessageAsc(String sessionId);

    /** Toutes les sessions d'un utilisateur, triées par date décroissante */
    @Query("SELECT DISTINCT m.sessionId FROM ChatMessage m WHERE m.utilisateur.id = :uid ORDER BY m.sessionId DESC")
    List<String> findSessionsByUtilisateurId(@Param("uid") Long uid);

    /** Historique complet d'un utilisateur (toutes sessions) */
    List<ChatMessage> findByUtilisateurIdOrderByDateMessageDesc(Long utilisateurId);

    /** Derniers N messages d'un utilisateur */
    @Query("SELECT m FROM ChatMessage m WHERE m.utilisateur.id = :uid ORDER BY m.dateMessage DESC")
    List<ChatMessage> findLastByUtilisateurId(@Param("uid") Long uid, org.springframework.data.domain.Pageable pageable);

    /** Messages d'une session publique (utilisateur null) */
    List<ChatMessage> findByUtilisateurIsNullAndSessionIdOrderByDateMessageAsc(String sessionId);

    long countByUtilisateurId(Long utilisateurId);
}
