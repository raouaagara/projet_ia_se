package com.clinique.gestion.controller;

import com.clinique.gestion.dto.ChatbotRequest;
import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.service.ChatbotService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Chatbot et statistiques")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chatbot")
    public ChatbotResponse chatbot(@RequestBody ChatbotRequest request) {
        return chatbotService.repondre(
            request.getMessage(),
            request.getContexte(),
            request.getRole(),
            request.getUserName()
        );
    }

    @GetMapping("/statistiques")
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public StatistiqueDto statistiques() {
        return chatbotService.statistiques();
    }
}
