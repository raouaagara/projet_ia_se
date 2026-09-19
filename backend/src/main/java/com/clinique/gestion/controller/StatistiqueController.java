package com.clinique.gestion.controller;

import com.clinique.gestion.dto.StatistiqueDetailDto;
import com.clinique.gestion.service.StatistiqueService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/statistiques-detail")
@RequiredArgsConstructor
@Tag(name = "Statistiques détaillées")
public class StatistiqueController {

    private final StatistiqueService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MEDECIN','SECRETAIRE')")
    public StatistiqueDetailDto getStatistiques() {
        return service.getStatistiquesCompletes();
    }
}
