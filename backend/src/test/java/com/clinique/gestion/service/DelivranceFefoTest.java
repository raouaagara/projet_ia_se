package com.clinique.gestion.service;

import com.clinique.gestion.dto.pharmacie.DelivranceDto;
import com.clinique.gestion.dto.pharmacie.DelivranceRequest;
import com.clinique.gestion.dto.pharmacie.ReceptionRequest;
import com.clinique.gestion.entity.Consultation;
import com.clinique.gestion.entity.Facture;
import com.clinique.gestion.entity.LigneOrdonnance;
import com.clinique.gestion.entity.LotMedicament;
import com.clinique.gestion.entity.Medicament;
import com.clinique.gestion.entity.MouvementStock;
import com.clinique.gestion.entity.Ordonnance;
import com.clinique.gestion.entity.StatutDelivrance;
import com.clinique.gestion.entity.StatutPaiement;
import com.clinique.gestion.entity.TypeMouvement;
import com.clinique.gestion.entity.TypeNotification;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.DelivranceRepository;
import com.clinique.gestion.repository.FactureRepository;
import com.clinique.gestion.repository.LotMedicamentRepository;
import com.clinique.gestion.repository.MedicamentRepository;
import com.clinique.gestion.repository.MouvementStockRepository;
import com.clinique.gestion.repository.NotificationRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

/**
 * Délivrance d'une ordonnance structurée (module M6) : prélèvement FEFO, mouvements de stock, bon de délivrance,
 * statut de l'ordonnance et facture du patient. Chaque test est annulé en fin d'exécution (transaction de test).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@WithUserDetails("pharmacien@clinique.local")
class DelivranceFefoTest {

    private static final BigDecimal PRIX = new BigDecimal("2.500");

    @Autowired PharmacieService pharmacie;
    @Autowired MedicamentRepository medicaments;
    @Autowired LotMedicamentRepository lots;
    @Autowired OrdonnanceRepository ordonnances;
    @Autowired ConsultationRepository consultations;
    @Autowired MouvementStockRepository mouvements;
    @Autowired DelivranceRepository delivrances;
    @Autowired FactureRepository factures;
    @Autowired NotificationRepository notifications;

    private final LocalDate aujourdhui = LocalDate.now();
    private Consultation consultation;
    private Medicament medicament;
    private LotMedicament lotLointain;
    private LotMedicament lotPerime;
    private LotMedicament lotProche;

    @BeforeEach
    void preparer() {
        consultation = consultations.findAll().get(0);
        medicament = medicament("TEST-FEFO");
        // Lots enregistrés dans le désordre : seul l'ordre des dates de péremption doit compter.
        lotLointain = lot(medicament, "LOT-LOINTAIN", 10, aujourdhui.plusMonths(12));
        lotPerime = lot(medicament, "LOT-PERIME", 50, aujourdhui.minusDays(3));
        lotProche = lot(medicament, "LOT-PROCHE", 4, aujourdhui.plusDays(20));
    }

    @Test
    void lesLotsSontPrelevesDuPlusProcheDeLaPeremptionAuPlusLointain() {
        Ordonnance ordonnance = ordonnance(medicament, 6);

        DelivranceDto bon = pharmacie.delivrer(demande(ordonnance, true));

        // Stock : le lot proche est vidé, le complément vient du lot lointain, le lot périmé n'est jamais touché.
        assertThat(restant(lotProche)).isZero();
        assertThat(restant(lotLointain)).isEqualTo(8);
        assertThat(restant(lotPerime)).isEqualTo(50);

        // Bon de délivrance : une ligne par lot, dans l'ordre FEFO.
        assertThat(bon.getStatut()).isEqualTo(StatutDelivrance.COMPLETE);
        assertThat(bon.getLignes()).extracting(DelivranceDto.Ligne::getNumeroLot, DelivranceDto.Ligne::getQuantite)
                .containsExactly(tuple("LOT-PROCHE", 4), tuple("LOT-LOINTAIN", 2));
        assertThat(bon.getMontantTotal()).isEqualByComparingTo("15.000");
        assertThat(bon.getAvertissements()).isEmpty();

        // Traçabilité : un mouvement de sortie par lot prélevé.
        assertThat(sorties(lotProche)).containsExactly(-4);
        assertThat(sorties(lotLointain)).containsExactly(-2);
        assertThat(sorties(lotPerime)).isEmpty();

        // Ordonnance entièrement délivrée.
        Ordonnance apres = ordonnances.findById(ordonnance.getId()).orElseThrow();
        assertThat(apres.getStatutDelivrance()).isEqualTo(StatutDelivrance.COMPLETE);
        assertThat(apres.getLignes().get(0).getQuantiteDelivree()).isEqualTo(6);
    }

    @Test
    void laDelivranceFactureLePatientEtLeNotifie() {
        Ordonnance ordonnance = ordonnance(medicament, 6);
        long notificationsAvant = notifications.count();

        DelivranceDto bon = pharmacie.delivrer(demande(ordonnance, true));

        Facture facture = factures.findById(bon.getFactureId()).orElseThrow();
        assertThat(facture.getPatient().getId()).isEqualTo(consultation.getPatient().getId());
        assertThat(facture.getStatut()).isEqualTo(StatutPaiement.EN_ATTENTE);
        assertThat(facture.getMontantTotal()).isEqualByComparingTo("15.000");
        assertThat(facture.getLignes()).hasSize(2)
                .allSatisfy(l -> assertThat(l.getPrixUnitaire()).isEqualByComparingTo(PRIX));
        assertThat(delivrances.findById(bon.getId()).orElseThrow().getFacture().getId()).isEqualTo(facture.getId());
        assertThat(notifications.count()).isGreaterThan(notificationsAvant);
        assertThat(notifications.findAll()).anyMatch(n -> n.getType() == TypeNotification.ORDONNANCE_DELIVREE
                && ordonnance.getId().equals(n.getReferenceId()));
    }

    @Test
    void sansFacturationAucuneFactureNEstCreee() {
        long facturesAvant = factures.count();

        DelivranceDto bon = pharmacie.delivrer(demande(ordonnance(medicament, 3), false));

        assertThat(bon.getFactureId()).isNull();
        assertThat(factures.count()).isEqualTo(facturesAvant);
    }

    @Test
    void unStockInsuffisantDonneUneDelivrancePartiellePuisComplete() {
        Ordonnance ordonnance = ordonnance(medicament, 20);

        DelivranceDto premier = pharmacie.delivrer(demande(ordonnance, true));

        assertThat(premier.getStatut()).isEqualTo(StatutDelivrance.PARTIELLE);
        assertThat(premier.getLignes()).extracting(DelivranceDto.Ligne::getQuantite).containsExactly(4, 10);
        assertThat(premier.getAvertissements()).singleElement().asString().contains("stock insuffisant", "14 sur 20");
        assertThat(restant(lotPerime)).isEqualTo(50);

        // Réapprovisionnement, puis délivrance du reliquat.
        ReceptionRequest reception = new ReceptionRequest();
        reception.setMedicamentId(medicament.getId());
        reception.setNumeroLot("LOT-NOUVEAU");
        reception.setQuantite(30);
        reception.setDatePeremption(aujourdhui.plusMonths(6));
        reception.setPrixAchat(new BigDecimal("1.200"));
        pharmacie.receptionner(reception);

        DelivranceDto second = pharmacie.delivrer(demande(ordonnance, true));

        assertThat(second.getStatut()).isEqualTo(StatutDelivrance.COMPLETE);
        assertThat(second.getLignes()).extracting(DelivranceDto.Ligne::getNumeroLot, DelivranceDto.Ligne::getQuantite)
                .containsExactly(tuple("LOT-NOUVEAU", 6));
        assertThat(ordonnances.findById(ordonnance.getId()).orElseThrow().getStatutDelivrance()).isEqualTo(StatutDelivrance.COMPLETE);
    }

    @Test
    void sansStockUtilisableRienNEstDelivre() {
        Medicament seulementPerime = medicament("TEST-PERIME");
        LotMedicament perime = lot(seulementPerime, "LOT-VIEUX", 40, aujourdhui.minusDays(1));
        Ordonnance ordonnance = ordonnance(seulementPerime, 2);
        long delivrancesAvant = delivrances.count();

        assertThatThrownBy(() -> pharmacie.delivrer(demande(ordonnance, true)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Aucun médicament n'a pu être délivré");
        assertThat(restant(perime)).isEqualTo(40);
        assertThat(delivrances.count()).isEqualTo(delivrancesAvant);
    }

    @Test
    void uneOrdonnanceDejaDelivreeEstRefusee() {
        Ordonnance ordonnance = ordonnance(medicament, 2);
        pharmacie.delivrer(demande(ordonnance, false));

        assertThatThrownBy(() -> pharmacie.delivrer(demande(ordonnance, false)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà été entièrement délivrée");
    }

    @Test
    void uneOrdonnanceEnTexteLibreNePeutPasEtreDelivree() {
        Ordonnance texteLibre = ordonnances.save(Ordonnance.builder().consultation(consultation)
                .dateEmission(aujourdhui).medicaments("Paracétamol 1 g").build());

        assertThatThrownBy(() -> pharmacie.delivrer(demande(texteLibre, true)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("n'est pas structurée");
    }

    // ── Jeu de données ───────────────────────────────────────────────────────

    private Medicament medicament(String code) {
        return medicaments.save(Medicament.builder().code(code).nomCommercial("Testoprofène").dci("Testoprofène")
                .forme("comprimé").dosage("100 mg").prixUnitaire(PRIX).seuilAlerte(5).build());
    }

    private LotMedicament lot(Medicament m, String numero, int quantite, LocalDate peremption) {
        return lots.save(LotMedicament.builder().medicament(m).numeroLot(numero)
                .quantiteInitiale(quantite).quantiteRestante(quantite)
                .datePeremption(peremption).dateReception(aujourdhui.minusDays(30))
                .prixAchat(new BigDecimal("1.000")).build());
    }

    private Ordonnance ordonnance(Medicament m, int quantite) {
        Ordonnance o = Ordonnance.builder().consultation(consultation).dateEmission(aujourdhui)
                .medicaments(m.libelle() + " — quantité : " + quantite)
                .statutDelivrance(StatutDelivrance.NON_DELIVREE).build();
        o.getLignes().add(LigneOrdonnance.builder().ordonnance(o).medicament(m)
                .posologie("1 comprimé matin et soir").dureeJours(5).quantite(quantite).build());
        return ordonnances.save(o);
    }

    private static DelivranceRequest demande(Ordonnance o, boolean facturer) {
        DelivranceRequest r = new DelivranceRequest();
        r.setOrdonnanceId(o.getId());
        r.setFacturer(facturer);
        return r;
    }

    private int restant(LotMedicament lot) {
        return lots.findById(lot.getId()).orElseThrow().getQuantiteRestante();
    }

    private List<Integer> sorties(LotMedicament lot) {
        return mouvements.findAll().stream()
                .filter(m -> m.getLot().getId().equals(lot.getId()) && m.getType() == TypeMouvement.SORTIE)
                .map(MouvementStock::getQuantite).toList();
    }
}
