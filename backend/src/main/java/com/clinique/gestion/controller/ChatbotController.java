package com.clinique.gestion.controller;

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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Assistant IA et statistiques")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chatbot")
    @Operation(summary = "Question à l'assistant MediAssist (le rôle est déduit du jeton, jamais de la requête)")
    public ChatbotResponse chatbot(@Valid @RequestBody ChatbotRequest request) {
        return chatbotService.repondre(request.getMessage());
    }

    @GetMapping("/statistiques")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public StatistiqueDto statistiques() {
        return chatbotService.statistiques();
    }
}
