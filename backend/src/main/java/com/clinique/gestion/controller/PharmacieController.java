package com.clinique.gestion.controller;

import com.clinique.gestion.dto.OrdonnanceDto;
import com.clinique.gestion.dto.pharmacie.AjustementRequest;
import com.clinique.gestion.dto.pharmacie.AlerteStockDto;
import com.clinique.gestion.dto.pharmacie.DelivranceDto;
import com.clinique.gestion.dto.pharmacie.DelivranceRequest;
import com.clinique.gestion.dto.pharmacie.FournisseurDto;
import com.clinique.gestion.dto.pharmacie.LotDto;
import com.clinique.gestion.dto.pharmacie.MedicamentDto;
import com.clinique.gestion.dto.pharmacie.MouvementDto;
import com.clinique.gestion.dto.pharmacie.ReceptionRequest;
import com.clinique.gestion.dto.pharmacie.TableauBordPharmacieDto;
import com.clinique.gestion.entity.TypeMouvement;
import com.clinique.gestion.service.PharmacieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacie")
@RequiredArgsConstructor
@Tag(name = "Pharmacie et stock")
public class PharmacieController {

    private final PharmacieService service;

    // ── Tableau de bord ──
    @GetMapping("/tableau-de-bord")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public TableauBordPharmacieDto tableauDeBord() {
        return service.tableauDeBord();
    }

    // ── Médicaments ──
    @GetMapping("/medicaments")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN','MEDECIN')")
    @Operation(summary = "Catalogue (recherche par nom, DCI ou code) avec le stock disponible")
    public List<MedicamentDto> medicaments(@RequestParam(required = false) String q,
                                           @RequestParam(defaultValue = "false") boolean lots) {
        return service.medicaments(q, lots);
    }

    @GetMapping("/medicaments/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN','MEDECIN')")
    public MedicamentDto medicament(@PathVariable Long id) {
        return service.medicament(id);
    }

    @PostMapping("/medicaments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public MedicamentDto creerMedicament(@Valid @RequestBody MedicamentDto dto) {
        return service.creerMedicament(dto);
    }

    @PutMapping("/medicaments/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public MedicamentDto modifierMedicament(@PathVariable Long id, @Valid @RequestBody MedicamentDto dto) {
        return service.modifierMedicament(id, dto);
    }

    @DeleteMapping("/medicaments/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    @Operation(summary = "Supprime un médicament, ou le désactive s'il a déjà été utilisé")
    public void supprimerMedicament(@PathVariable Long id) {
        service.supprimerMedicament(id);
    }

    // ── Fournisseurs ──
    @GetMapping("/fournisseurs")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public List<FournisseurDto> fournisseurs() {
        return service.fournisseurs();
    }

    @PostMapping("/fournisseurs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public FournisseurDto creerFournisseur(@Valid @RequestBody FournisseurDto dto) {
        return service.enregistrerFournisseur(null, dto);
    }

    @PutMapping("/fournisseurs/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public FournisseurDto modifierFournisseur(@PathVariable Long id, @Valid @RequestBody FournisseurDto dto) {
        return service.enregistrerFournisseur(id, dto);
    }

    @DeleteMapping("/fournisseurs/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public void supprimerFournisseur(@PathVariable Long id) {
        service.supprimerFournisseur(id);
    }

    // ── Stock ──
    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    @Operation(summary = "État du stock par médicament, avec le détail des lots")
    public List<MedicamentDto> stock() {
        return service.medicaments(null, true);
    }

    @PostMapping("/receptions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public LotDto receptionner(@Valid @RequestBody ReceptionRequest request) {
        return service.receptionner(request);
    }

    @PostMapping("/ajustements")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public LotDto ajuster(@Valid @RequestBody AjustementRequest request) {
        return service.ajuster(request);
    }

    @PostMapping("/lots-perimes/retrait")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public Map<String, Integer> retirerLotsPerimes() {
        return Map.of("lotsRetires", service.retirerLotsPerimes());
    }

    @GetMapping("/mouvements")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public List<MouvementDto> mouvements(@RequestParam(required = false) TypeMouvement type) {
        return service.mouvements(type);
    }

    @GetMapping("/alertes")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public List<AlerteStockDto> alertes() {
        return service.alertes();
    }

    // ── Ordonnances et délivrances ──
    @GetMapping("/ordonnances")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    @Operation(summary = "Ordonnances structurées restant à délivrer")
    public List<OrdonnanceDto> ordonnancesADelivrer() {
        return service.ordonnancesADelivrer();
    }

    @PostMapping("/delivrances")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    @Operation(summary = "Délivre une ordonnance (règle FEFO), met à jour le stock et facture le patient")
    public DelivranceDto delivrer(@Valid @RequestBody DelivranceRequest request) {
        return service.delivrer(request);
    }

    @GetMapping("/delivrances")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN')")
    public List<DelivranceDto> delivrances() {
        return service.delivrances();
    }

    @GetMapping("/delivrances/ordonnance/{ordonnanceId}")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN','MEDECIN','PATIENT')")
    public List<DelivranceDto> delivrancesOrdonnance(@PathVariable Long ordonnanceId) {
        return service.delivrancesOrdonnance(ordonnanceId);
    }
}
