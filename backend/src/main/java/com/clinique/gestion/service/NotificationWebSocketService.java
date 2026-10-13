package com.clinique.gestion.service;

import com.clinique.gestion.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service pour envoyer des notifications en temps réel via WebSocket/STOMP.
 * Remplace le polling toutes les 15s côté frontend.
 */
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Envoie une notification à un utilisateur spécifique.
     * Côté Angular : client.subscribe('/user/{uid}/queue/notifications', ...)
     */
    public void envoyerNotification(Long utilisateurId, Notification notification) {
        Map<String, Object> payload = Map.of(
            "id",           notification.getId(),
            "titre",        notification.getTitre(),
            "message",      notification.getMessage(),
            "type",         notification.getType().name(),
            "lue",          notification.isLue(),
            "dateCreation", notification.getDateCreation().toString()
        );
        // Message ciblé à un utilisateur précis via /user/{uid}/queue/notifications
        messagingTemplate.convertAndSendToUser(
            utilisateurId.toString(),
            "/queue/notifications",
            payload
        );
    }

    /**
     * Broadcast : mise à jour du compteur de notifications pour tous les admins.
     */
    public void broadcastNotifCount(Long utilisateurId, long count) {
        messagingTemplate.convertAndSendToUser(
            utilisateurId.toString(),
            "/queue/notif-count",
            Map.of("count", count)
        );
    }
}
