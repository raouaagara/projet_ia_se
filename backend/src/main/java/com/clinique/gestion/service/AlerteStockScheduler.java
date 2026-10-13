package com.clinique.gestion.service;

import com.clinique.gestion.dto.pharmacie.AlerteStockDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/** Synthèse quotidienne des alertes de stock envoyée aux pharmaciens (chaque matin à 7 h). */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlerteStockScheduler {

    private final PharmacieService pharmacieService;

    @Scheduled(cron = "0 0 7 * * *")
    public void envoyerSyntheseQuotidienne() {
        List<AlerteStockDto> alertes = pharmacieService.alertes();
        if (alertes.isEmpty()) {
            return;
        }
        long ruptures = alertes.stream().filter(a -> a.getType().equals("RUPTURE")).count();
        long bas = alertes.stream().filter(a -> a.getType().equals("STOCK_BAS")).count();
        long perimes = alertes.stream().filter(a -> a.getType().equals("PERIME")).count();
        long proches = alertes.stream().filter(a -> a.getType().equals("PEREMPTION_PROCHE")).count();
        String message = String.format("%d rupture(s), %d stock(s) bas, %d lot(s) périmé(s), %d péremption(s) dans les %d jours.",
                ruptures, bas, perimes, proches, PharmacieService.JOURS_ALERTE_PEREMPTION);
        pharmacieService.notifierPharmaciens("Synthèse des alertes de stock", message, null);
        log.info("Synthèse des alertes de stock envoyée : {}", message);
    }
}
