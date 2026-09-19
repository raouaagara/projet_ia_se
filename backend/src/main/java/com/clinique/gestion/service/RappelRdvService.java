package com.clinique.gestion.service;

import com.clinique.gestion.entity.RendezVous;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service de rappels automatiques par notification interne.
 * Tourne toutes les heures et envoie une notification aux patients
 * dont le RDV est dans les prochaines 24h.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RappelRdvService {

    private final RendezVousRepository rendezVousRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");

    /**
     * Exécuté toutes les heures (cron : 0 0 * * * *)
     * Cherche les RDV dans les prochaines 24h et envoie un rappel.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void envoyerRappels() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime dans24h    = maintenant.plusHours(24);

        List<RendezVous> rdvs = rendezVousRepository
                .findByDateHeureBetween(maintenant, dans24h)
                .stream()
                .filter(r -> r.getStatut() == StatutRendezVous.CONFIRME
                          || r.getStatut() == StatutRendezVous.PLANIFIE)
                .toList();

        for (RendezVous rdv : rdvs) {
            if (rdv.getPatient() != null && rdv.getPatient().getUtilisateur() != null) {
                String nomMedecin = "Dr " + rdv.getMedecin().getPrenom()
                        + " " + rdv.getMedecin().getNom();
                String dateStr = rdv.getDateHeure().format(FMT);

                notificationService.envoyerRappelRdv(
                        rdv.getPatient().getUtilisateur(),
                        nomMedecin,
                        dateStr,
                        rdv.getId());
            }
        }

        if (!rdvs.isEmpty()) {
            log.info("Rappels RDV envoyés : {} notification(s)", rdvs.size());
        }
    }
}
