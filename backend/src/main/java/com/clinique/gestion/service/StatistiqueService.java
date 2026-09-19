package com.clinique.gestion.service;

import com.clinique.gestion.dto.StatistiqueDetailDto;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.entity.StatutPaiement;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatistiqueService {

    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final FactureRepository factureRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final UtilisateurRepository utilisateurRepository;

    public StatistiqueDetailDto getStatistiquesCompletes() {

        // RDV
        long totalRdv  = rendezVousRepository.count();
        long planifies = rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE);
        long confirmes = rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME);
        long annules   = rendezVousRepository.countByStatut(StatutRendezVous.ANNULE);
        long termines  = rendezVousRepository.countByStatut(StatutRendezVous.TERMINE);
        double tauxConf = totalRdv > 0 ? Math.round(confirmes * 100.0 / totalRdv * 10) / 10.0 : 0;
        double tauxAnn  = totalRdv > 0 ? Math.round(annules  * 100.0 / totalRdv * 10) / 10.0 : 0;

        // Facturation
        BigDecimal revenusTotal = factureRepository.sumRevenusTotal();
        if (revenusTotal == null) revenusTotal = BigDecimal.ZERO;

        LocalDate debutMois = LocalDate.now().withDayOfMonth(1);
        LocalDate finMois   = debutMois.plusMonths(1);
        BigDecimal revenusMois = factureRepository.sumRevenusPeriode(debutMois, finMois);
        if (revenusMois == null) revenusMois = BigDecimal.ZERO;

        // Top médecins par RDV
        List<Object[]> topData = rendezVousRepository.countByMedecin();
        List<StatistiqueDetailDto.MedecinStatDto> topMedecins = topData.stream()
                .limit(5)
                .map(row -> StatistiqueDetailDto.MedecinStatDto.builder()
                        .nomMedecin((String) row[0])
                        .nbRendezVous((Long) row[1])
                        .build())
                .toList();

        return StatistiqueDetailDto.builder()
                .patients(patientRepository.count())
                .medecins(medecinRepository.count())
                .medecinsDisponibles(medecinRepository.countByDisponibleTrue())
                .rendezVous(totalRdv)
                .consultations(consultationRepository.count())
                .ordonnances(ordonnanceRepository.count())
                .rendezVousPlanifies(planifies)
                .rendezVousConfirmes(confirmes)
                .rendezVousAnnules(annules)
                .rendezVousTermines(termines)
                .tauxConfirmation(tauxConf)
                .tauxAnnulation(tauxAnn)
                .facturesTotal(factureRepository.count())
                .facturesPayees(factureRepository.countByStatut(StatutPaiement.PAYE))
                .facturesEnAttente(factureRepository.countByStatut(StatutPaiement.EN_ATTENTE))
                .revenusTotal(revenusTotal)
                .revenusMoisActuel(revenusMois)
                .examensTotal(examenRepository.count())
                .examensDemandes(examenRepository.countByStatut(StatutExamen.DEMANDE))
                .examensResultatsDisponibles(examenRepository.countByStatut(StatutExamen.RESULTAT_DISPONIBLE))
                .utilisateurs(utilisateurRepository.count())
                .topMedecins(topMedecins)
                .build();
    }
}
