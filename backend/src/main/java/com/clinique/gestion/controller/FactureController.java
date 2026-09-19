package com.clinique.gestion.controller;

import com.clinique.gestion.dto.FactureDto;
import com.clinique.gestion.entity.StatutPaiement;
import com.clinique.gestion.service.FactureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
@Tag(name = "Facturation")
public class FactureController {

    private final FactureService factureService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public List<FactureDto> findAll() { return factureService.findAll(); }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','PATIENT')")
    public FactureDto findById(@PathVariable Long id) { return factureService.findById(id); }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE','PATIENT')")
    public List<FactureDto> findByPatient(@PathVariable Long patientId) {
        return factureService.findByPatient(patientId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public FactureDto create(@RequestBody FactureDto dto) { return factureService.create(dto); }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public FactureDto update(@PathVariable Long id, @RequestBody FactureDto dto) {
        return factureService.update(id, dto);
    }

    @PutMapping("/{id}/paiement")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public FactureDto updatePaiement(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal montant = new BigDecimal(body.get("montantPaye").toString());
        StatutPaiement statut = StatutPaiement.valueOf(body.get("statut").toString());
        return factureService.updatePaiement(id, montant, statut);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) { factureService.delete(id); }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','SECRETAIRE')")
    public Object stats() { return factureService.stats(); }
}
