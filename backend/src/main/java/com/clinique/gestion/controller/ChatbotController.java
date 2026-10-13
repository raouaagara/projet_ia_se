package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ChatHistoryDto;
import com.clinique.gestion.dto.ChatbotRequest;
import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Assistant IA et statistiques")
public class ChatbotController {

    private final ChatbotService chatbotService;

    // ── CHATBOT ───────────────────────────────────────────────────────────

    @PostMapping("/chatbot")
    @Operation(summary = "Question à l'assistant MediAssist (le rôle est déduit du jeton, jamais de la requête)")
    public ChatbotResponse chatbot(@Valid @RequestBody ChatbotRequest request) {
        return chatbotService.repondre(request.getMessage(), request.getSessionId());
    }

    // ── HISTORIQUE ────────────────────────────────────────────────────────

    // Historique : chacun ne lit ou ne supprime que ses propres conversations (l'administrateur peut tout consulter).

    /** Toutes les sessions d'un utilisateur */
    @GetMapping("/chatbot/historique/{utilisateurId}")
    @PreAuthorize("isAuthenticated()")
    public List<ChatHistoryDto> historique(@PathVariable Long utilisateurId) {
        return chatbotService.getSessionsUtilisateur(utilisateurId);
    }

    /** Messages d'une session précise */
    @GetMapping("/chatbot/session/{sessionId}")
    @PreAuthorize("isAuthenticated()")
    public List<ChatHistoryDto.ChatMessageDto> session(@PathVariable String sessionId) {
        return chatbotService.getSession(sessionId);
    }

    /** Supprimer l'historique d'un utilisateur */
    @DeleteMapping("/chatbot/historique/{utilisateurId}")
    @PreAuthorize("isAuthenticated()")
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
