package com.clinique.gestion.controller;

import com.clinique.gestion.dto.NotificationDto;
import com.clinique.gestion.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/utilisateur/{uid}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public List<NotificationDto> findByUtilisateur(@PathVariable Long uid) {
        return notificationService.findByUtilisateur(uid);
    }

    @GetMapping("/utilisateur/{uid}/non-lues")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public List<NotificationDto> findNonLues(@PathVariable Long uid) {
        return notificationService.findNonLues(uid);
    }

    @GetMapping("/utilisateur/{uid}/count")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public Map<String, Long> countNonLues(@PathVariable Long uid) {
        return Map.of("count", notificationService.countNonLues(uid));
    }

    @PutMapping("/{id}/lire")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public void marquerLue(@PathVariable Long id) { notificationService.marquerLue(id); }

    @PutMapping("/utilisateur/{uid}/lire-tout")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public void marquerToutesLues(@PathVariable Long uid) { notificationService.marquerToutesLues(uid); }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT')")
    public void supprimer(@PathVariable Long id) { notificationService.supprimer(id); }

    /** Crée une notification de test pour un utilisateur (pratique en développement) */
    @PostMapping("/test/{uid}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN')")
    public void createTest(@PathVariable Long uid) {
        notificationService.creer(uid, "🔔 Notification de test",
            "Ceci est une notification de test créée manuellement.",
            com.clinique.gestion.entity.TypeNotification.INFORMATION, null, null);
    }
}
