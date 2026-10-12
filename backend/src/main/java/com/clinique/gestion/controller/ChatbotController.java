package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ChatHistoryDto;
import com.clinique.gestion.dto.ChatbotRequest;
import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.service.ChatbotService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Chatbot et statistiques")
public class ChatbotController {

    private final ChatbotService chatbotService;

    // ── CHATBOT ───────────────────────────────────────────────────────────

    @PostMapping("/chatbot")
    public ChatbotResponse chatbot(@RequestBody ChatbotRequest request) {
        return chatbotService.repondre(
            request.getMessage(),
            request.getContexte(),
            request.getRole(),
            request.getUserName(),
            request.getUtilisateurId(),
            request.getSessionId()
        );
    }

    // ── HISTORIQUE ────────────────────────────────────────────────────────

    /** Toutes les sessions d'un utilisateur */
    @GetMapping("/chatbot/historique/{utilisateurId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT','LABO')")
    public List<ChatHistoryDto> historique(@PathVariable Long utilisateurId) {
        return chatbotService.getSessionsUtilisateur(utilisateurId);
    }

    /** Messages d'une session précise */
    @GetMapping("/chatbot/session/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT','LABO')")
    public List<ChatHistoryDto.ChatMessageDto> session(@PathVariable String sessionId) {
        return chatbotService.getSession(sessionId);
    }

    /** Supprimer l'historique d'un utilisateur */
    @DeleteMapping("/chatbot/historique/{utilisateurId}")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE','PATIENT','LABO')")
    public void supprimerHistorique(@PathVariable Long utilisateurId) {
        chatbotService.supprimerHistorique(utilisateurId);
    }

    // ── STATISTIQUES ──────────────────────────────────────────────────────

    @GetMapping("/statistiques")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public StatistiqueDto statistiques() {
        return chatbotService.statistiques();
    }
}
