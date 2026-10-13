package com.clinique.gestion.config;

import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Données de démonstration des modules M5 (IA) et M6 (Pharmacie). Chaque bloc ne s'exécute que si ses données
 * sont absentes : le seeder complète aussi une base créée avant l'ajout de ces modules.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class ModulesDataSeeder implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final MedicamentRepository medicamentRepository;
    private final FournisseurRepository fournisseurRepository;
    private final LotMedicamentRepository lotRepository;
    private final MouvementStockRepository mouvementRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Utilisateur pharmacien = comptePharmacien();
        if (medicamentRepository.count() == 0) {
            pharmacie(pharmacien);
        }
        ordonnanceStructuree();
        historiqueRendezVous();
    }

    private Utilisateur comptePharmacien() {
        return utilisateurRepository.findByEmail("pharmacien@clinique.local").orElseGet(() -> {
            log.info("Création du compte de démonstration pharmacien@clinique.local");
            return utilisateurRepository.save(Utilisateur.builder()
                    .email("pharmacien@clinique.local").motDePasse(passwordEncoder.encode("password"))
                    .nom("Durand").prenom("Inès").telephone("0102030409")
                    .role(Role.PHARMACIEN).actif(true).build());
        });
    }

    private void pharmacie(Utilisateur pharmacien) {
        Fournisseur cerp = fournisseurRepository.save(Fournisseur.builder()
                .nom("Répartiteur Santé Ouest").telephone("0240506070").email("commandes@sante-ouest.example")
                .adresse("Zone industrielle de la Charguia, Tunis").build());
        Fournisseur medi = fournisseurRepository.save(Fournisseur.builder()
                .nom("MédiDistribution").telephone("0478901234").email("service.client@medidistribution.example")
                .adresse("Route de Gremda, Sfax").build());

        LocalDate today = LocalDate.now();
        Medicament paracetamol = med("PARA1000", "Paracétamol", "Paracétamol", "comprimé", "1 g", "2.800", 40, false);
        Medicament amoxicilline = med("AMOX1000", "Amoxicilline", "Amoxicilline", "gélule", "1 g", "7.450", 20, true);
        Medicament ibuprofene = med("IBU400", "Ibuprofène", "Ibuprofène", "comprimé", "400 mg", "3.200", 30, false);
        Medicament cetirizine = med("CETI10", "Cétirizine", "Cétirizine", "comprimé", "10 mg", "4.950", 15, false);
        Medicament omeprazole = med("OMEP20", "Oméprazole", "Oméprazole", "gélule", "20 mg", "8.300", 15, true);
        Medicament metformine = med("METF850", "Metformine", "Metformine", "comprimé", "850 mg", "4.100", 20, true);
        Medicament amlodipine = med("AMLO5", "Amlodipine", "Amlodipine", "comprimé", "5 mg", "6.750", 15, true);
        Medicament salbutamol = med("SALB100", "Salbutamol", "Salbutamol", "inhalateur", "100 µg/dose", "9.900", 10, true);
        Medicament azithromycine = med("AZIT250", "Azithromycine", "Azithromycine", "comprimé", "250 mg", "12.600", 10, true);
        med("LORA10", "Loratadine", "Loratadine", "comprimé", "10 mg", "4.700", 10, false);

        LotMedicament para1 = lot(paracetamol, cerp, "PA24-118", 120, today.plusMonths(14), "1.20", pharmacien);
        lot(paracetamol, medi, "PA24-207", 60, today.plusDays(21), "1.25", pharmacien);
        LotMedicament amox = lot(amoxicilline, cerp, "AM24-031", 45, today.plusMonths(10), "2.90", pharmacien);
        LotMedicament ibu = lot(ibuprofene, medi, "IB24-552", 80, today.plusMonths(18), "1.60", pharmacien);
        lot(cetirizine, cerp, "CE24-090", 12, today.plusMonths(9), "1.70", pharmacien);
        lot(omeprazole, medi, "OM24-310", 50, today.plusMonths(16), "3.10", pharmacien);
        lot(metformine, cerp, "ME24-044", 90, today.plusMonths(20), "2.05", pharmacien);
        lot(amlodipine, medi, "AL24-019", 35, today.plusMonths(12), "2.40", pharmacien);
        LotMedicament salb = lot(salbutamol, cerp, "SA24-007", 14, today.plusDays(12), "4.10", pharmacien);
        lot(azithromycine, medi, "AZ23-880", 8, today.minusDays(5), "5.30", pharmacien);
        // Consommation des 30 derniers jours (sert au calcul des risques de rupture).
        sortie(para1, 40, 18, pharmacien);
        sortie(para1, 35, 9, pharmacien);
        sortie(para1, 30, 2, pharmacien);
        sortie(amox, 18, 12, pharmacien);
        sortie(ibu, 10, 6, pharmacien);
        sortie(salb, 8, 4, pharmacien);
        log.info("Catalogue de pharmacie de démonstration créé ({} médicaments)", medicamentRepository.count());
    }

    /** Ordonnance structurée à délivrer pour la patiente de démonstration. */
    private void ordonnanceStructuree() {
        boolean dejaPresente = ordonnanceRepository.findAll().stream().anyMatch(o -> !o.getLignes().isEmpty());
        if (dejaPresente) return;
        List<Consultation> consultations = consultationRepository.findAll();
        if (consultations.isEmpty()) return;
        Consultation consultation = consultations.get(0);
        Medicament paracetamol = medicamentRepository.findByCode("PARA1000").orElse(null);
        Medicament cetirizine = medicamentRepository.findByCode("CETI10").orElse(null);
        if (paracetamol == null || cetirizine == null) return;

        Ordonnance o = Ordonnance.builder()
                .consultation(consultation)
                .dateEmission(LocalDate.now().minusDays(1))
                .instructions("Boire beaucoup d'eau. Reconsulter si la fièvre persiste au-delà de 3 jours.")
                .statutDelivrance(StatutDelivrance.NON_DELIVREE)
                .medicaments("Paracétamol 1 g (comprimé) — 1 comprimé jusqu'à 3 fois par jour pendant 5 jour(s) — quantité : 2\n"
                        + "Cétirizine 10 mg (comprimé) — 1 comprimé le soir pendant 10 jour(s) — quantité : 1")
                .build();
        o.getLignes().add(LigneOrdonnance.builder().ordonnance(o).medicament(paracetamol)
                .posologie("1 comprimé jusqu'à 3 fois par jour").dureeJours(5).quantite(2).build());
        o.getLignes().add(LigneOrdonnance.builder().ordonnance(o).medicament(cetirizine)
                .posologie("1 comprimé le soir").dureeJours(10).quantite(1).build());
        ordonnanceRepository.save(o);
        log.info("Ordonnance structurée de démonstration créée (n° {})", o.getId());
    }

    /** Historique de rendez-vous sur 8 semaines, utilisé par les prévisions d'activité. */
    private void historiqueRendezVous() {
        if (rendezVousRepository.count() >= 15) return;
        List<Patient> patients = patientRepository.findAll();
        List<Medecin> medecins = medecinRepository.findAll();
        if (patients.isEmpty() || medecins.isEmpty()) return;

        LocalDate debut = LocalDate.now().minusWeeks(8);
        int[] heures = {9, 10, 11, 14, 15, 16};
        int n = 0;
        for (LocalDate d = debut; d.isBefore(LocalDate.now()); d = d.plusDays(1)) {
            if (d.getDayOfWeek() == DayOfWeek.SUNDAY) continue;
            // Profil réaliste : affluence plus forte en début de semaine, réduite le samedi.
            int parJour = switch (d.getDayOfWeek()) {
                case MONDAY -> 4;
                case TUESDAY -> 3;
                case SATURDAY -> 1;
                default -> 2;
            };
            for (int i = 0; i < parJour; i++) {
                int heure = heures[(n + i) % heures.length];
                boolean annule = (d.getDayOfWeek() == DayOfWeek.MONDAY && heure == 9) || n % 9 == 0;
                rendezVousRepository.save(RendezVous.builder()
                        .patient(patients.get(n % patients.size()))
                        .medecin(medecins.get((n + i) % medecins.size()))
                        .dateHeure(LocalDateTime.of(d.getYear(), d.getMonth(), d.getDayOfMonth(), heure, 0))
                        .motif(i % 2 == 0 ? "Consultation de suivi" : "Première consultation")
                        .statut(annule ? StatutRendezVous.ANNULE : StatutRendezVous.TERMINE)
                        .rappelEnvoye(true)
                        .build());
                n++;
            }
        }
        log.info("Historique de démonstration : {} rendez-vous passés créés", n);
    }

    private Medicament med(String code, String nom, String dci, String forme, String dosage, String prix, int seuil, boolean surOrdonnance) {
        return medicamentRepository.save(Medicament.builder()
                .code(code).nomCommercial(nom).dci(dci).forme(forme).dosage(dosage)
                .prixUnitaire(new BigDecimal(prix)).seuilAlerte(seuil).surOrdonnance(surOrdonnance).build());
    }

    private void sortie(LotMedicament lot, int quantite, int joursAvant, Utilisateur pharmacien) {
        lot.setQuantiteRestante(lot.getQuantiteRestante() - quantite);
        lotRepository.save(lot);
        mouvementRepository.save(MouvementStock.builder()
                .lot(lot).type(TypeMouvement.SORTIE).quantite(-quantite)
                .motif("Délivrances au comptoir")
                .utilisateur(pharmacien)
                .dateMouvement(LocalDateTime.now().minusDays(joursAvant))
                .build());
    }

    private LotMedicament lot(Medicament m, Fournisseur f, String numero, int quantite, LocalDate peremption, String prixAchat, Utilisateur pharmacien) {
        LotMedicament lot = lotRepository.save(LotMedicament.builder()
                .medicament(m).fournisseur(f).numeroLot(numero)
                .quantiteInitiale(quantite).quantiteRestante(quantite)
                .datePeremption(peremption).dateReception(LocalDate.now().minusDays(20))
                .prixAchat(new BigDecimal(prixAchat)).build());
        mouvementRepository.save(MouvementStock.builder()
                .lot(lot).type(TypeMouvement.ENTREE).quantite(quantite)
                .motif("Réception du lot " + numero + " — " + f.getNom())
                .utilisateur(pharmacien)
                .dateMouvement(LocalDateTime.now().minusDays(20))
                .build());
        return lot;
    }
}
