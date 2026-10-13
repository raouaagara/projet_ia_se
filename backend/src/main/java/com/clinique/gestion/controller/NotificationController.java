package com.clinique.gestion.controller;

import com.clinique.gestion.dto.NotificationDto;
import com.clinique.gestion.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Notifications d'un utilisateur : chacun n'accède qu'aux siennes (contrôle dans le service). */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/utilisateur/{uid}")
    public List<NotificationDto> findByUtilisateur(@PathVariable Long uid) {
        notificationService.verifierProprietaire(uid);
        return notificationService.findByUtilisateur(uid);
    }

    @GetMapping("/utilisateur/{uid}/non-lues")
    public List<NotificationDto> findNonLues(@PathVariable Long uid) {
        notificationService.verifierProprietaire(uid);
        return notificationService.findNonLues(uid);
    }

    @GetMapping("/utilisateur/{uid}/count")
    public Map<String, Long> countNonLues(@PathVariable Long uid) {
        notificationService.verifierProprietaire(uid);
        return Map.of("count", notificationService.countNonLues(uid));
    }

    @PutMapping("/{id}/lire")
    public void marquerLue(@PathVariable Long id) {
        notificationService.marquerLue(id);
    }

    @PutMapping("/utilisateur/{uid}/lire-tout")
    public void marquerToutesLues(@PathVariable Long uid) {
        notificationService.verifierProprietaire(uid);
        notificationService.marquerToutesLues(uid);
    }

    @DeleteMapping("/{id}")
    public void supprimer(@PathVariable Long id) {
        notificationService.supprimer(id);
    }
}
