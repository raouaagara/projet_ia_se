package com.clinique.gestion.service;

import com.clinique.gestion.dto.FactureDto;
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
import com.clinique.gestion.entity.Delivrance;
import com.clinique.gestion.entity.Fournisseur;
import com.clinique.gestion.entity.LigneDelivrance;
import com.clinique.gestion.entity.LigneOrdonnance;
import com.clinique.gestion.entity.LotMedicament;
import com.clinique.gestion.entity.Medicament;
import com.clinique.gestion.entity.MouvementStock;
import com.clinique.gestion.entity.Ordonnance;
import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.StatutDelivrance;
import com.clinique.gestion.entity.TypeMouvement;
import com.clinique.gestion.entity.TypeNotification;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.DelivranceRepository;
import com.clinique.gestion.repository.FactureRepository;
import com.clinique.gestion.repository.FournisseurRepository;
import com.clinique.gestion.repository.LigneOrdonnanceRepository;
import com.clinique.gestion.repository.LotMedicamentRepository;
import com.clinique.gestion.repository.MedicamentRepository;
import com.clinique.gestion.repository.MouvementStockRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Module M6 — Pharmacie et stock : catalogue, lots, mouvements, délivrance des ordonnances (FEFO) et alertes.
 */
@Service
@RequiredArgsConstructor
public class PharmacieService {

    /** Un lot est signalé lorsqu'il périme dans moins de ce nombre de jours. */
    public static final int JOURS_ALERTE_PEREMPTION = 30;
    private static final DateTimeFormatter FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MedicamentRepository medicamentRepository;
    private final FournisseurRepository fournisseurRepository;
    private final LotMedicamentRepository lotRepository;
    private final MouvementStockRepository mouvementRepository;
    private final LigneOrdonnanceRepository ligneOrdonnanceRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final DelivranceRepository delivranceRepository;
    private final FactureRepository factureRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final OrdonnanceService ordonnanceService;
    private final FactureService factureService;
    private final NotificationService notificationService;
    private final UtilisateurCourant utilisateurCourant;

    // ══ Catalogue des médicaments ═══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<MedicamentDto> medicaments(String recherche, boolean avecLots) {
        List<Medicament> liste = (recherche == null || recherche.isBlank())
                ? medicamentRepository.findAllByOrderByNomCommercialAsc()
                : medicamentRepository.rechercher(recherche.trim());
        Map<Long, List<LotMedicament>> lots = lotsParMedicament();
        return liste.stream().map(m -> toDto(m, lots.getOrDefault(m.getId(), List.of()), avecLots)).toList();
    }

    @Transactional(readOnly = true)
    public MedicamentDto medicament(Long id) {
        Medicament m = getMedicament(id);
        return toDto(m, lotRepository.findByMedicamentIdOrderByDatePeremptionAsc(id), true);
    }

    @Transactional
    public MedicamentDto creerMedicament(MedicamentDto dto) {
        String code = dto.getCode().trim().toUpperCase();
        if (medicamentRepository.existsByCode(code)) {
            throw new IllegalStateException("Un médicament avec le code " + code + " existe déjà.");
        }
        Medicament m = new Medicament();
        appliquer(m, dto);
        m.setCode(code);
        return toDto(medicamentRepository.save(m), List.of(), false);
    }

    @Transactional
    public MedicamentDto modifierMedicament(Long id, MedicamentDto dto) {
        Medicament m = getMedicament(id);
        String code = dto.getCode().trim().toUpperCase();
        if (!code.equals(m.getCode()) && medicamentRepository.existsByCode(code)) {
            throw new IllegalStateException("Un médicament avec le code " + code + " existe déjà.");
        }
        appliquer(m, dto);
        m.setCode(code);
        return toDto(medicamentRepository.save(m), lotRepository.findByMedicamentIdOrderByDatePeremptionAsc(id), false);
    }

    /** Un médicament déjà utilisé (lots, ordonnances) est désactivé plutôt que supprimé, pour garder l'historique. */
    @Transactional
    public void supprimerMedicament(Long id) {
        Medicament m = getMedicament(id);
        boolean utilise = !lotRepository.findByMedicamentIdOrderByDatePeremptionAsc(id).isEmpty()
                || ligneOrdonnanceRepository.existsByMedicamentId(id);
        if (utilise) {
            m.setActif(false);
            medicamentRepository.save(m);
        } else {
            medicamentRepository.delete(m);
        }
    }

    // ══ Fournisseurs ════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<FournisseurDto> fournisseurs() {
        return fournisseurRepository.findAllByOrderByNomAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public FournisseurDto enregistrerFournisseur(Long id, FournisseurDto dto) {
        Fournisseur f = id == null ? new Fournisseur() : getFournisseur(id);
        f.setNom(dto.getNom().trim());
        f.setTelephone(dto.getTelephone());
        f.setEmail(dto.getEmail());
        f.setAdresse(dto.getAdresse());
        f.setActif(dto.isActif());
        return toDto(fournisseurRepository.save(f));
    }

    @Transactional
    public void supprimerFournisseur(Long id) {
        Fournisseur f = getFournisseur(id);
        boolean utilise = lotRepository.findAll().stream()
                .anyMatch(l -> l.getFournisseur() != null && l.getFournisseur().getId().equals(id));
        if (utilise) {
            f.setActif(false);
            fournisseurRepository.save(f);
        } else {
            fournisseurRepository.delete(f);
        }
    }

    // ══ Stock ═══════════════════════════════════════════════════════════════

    @Transactional
    public LotDto receptionner(ReceptionRequest r) {
        Medicament m = getMedicament(r.getMedicamentId());
        if (!m.isActif()) {
            throw new IllegalStateException("Ce médicament n'est plus référencé : réactivez-le avant de réceptionner un lot.");
        }
        if (!r.getDatePeremption().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de péremption doit être postérieure à aujourd'hui.");
        }
        Fournisseur fournisseur = r.getFournisseurId() == null ? null : getFournisseur(r.getFournisseurId());
        LotMedicament lot = lotRepository.save(LotMedicament.builder()
                .medicament(m)
                .fournisseur(fournisseur)
                .numeroLot(r.getNumeroLot().trim().toUpperCase())
                .quantiteInitiale(r.getQuantite())
                .quantiteRestante(r.getQuantite())
                .datePeremption(r.getDatePeremption())
                .dateReception(LocalDate.now())
                .prixAchat(r.getPrixAchat())
                .build());
        mouvement(lot, TypeMouvement.ENTREE, r.getQuantite(),
                "Réception du lot " + lot.getNumeroLot() + (fournisseur != null ? " — " + fournisseur.getNom() : ""));
        return toDto(lot);
    }

    @Transactional
    public LotDto ajuster(AjustementRequest r) {
        LotMedicament lot = lotRepository.findById(r.getLotId())
                .orElseThrow(() -> new IllegalArgumentException("Lot introuvable"));
        int delta = r.getNouvelleQuantite() - lot.getQuantiteRestante();
        if (delta == 0) {
            throw new IllegalArgumentException("La quantité saisie est identique au stock actuel du lot.");
        }
        lot.setQuantiteRestante(r.getNouvelleQuantite());
        lotRepository.save(lot);
        mouvement(lot, TypeMouvement.AJUSTEMENT, delta, "Inventaire : " + r.getMotif().trim());
        return toDto(lot);
    }

    /** Sort du stock les quantités des lots périmés (mouvement PEREMPTION). Retourne le nombre de lots traités. */
    @Transactional
    public int retirerLotsPerimes() {
        LocalDate today = LocalDate.now();
        int traites = 0;
        for (LotMedicament lot : lotRepository.findAllByOrderByDatePeremptionAsc()) {
            if (lot.getQuantiteRestante() > 0 && lot.getDatePeremption().isBefore(today)) {
                int quantite = lot.getQuantiteRestante();
                lot.setQuantiteRestante(0);
                lotRepository.save(lot);
                mouvement(lot, TypeMouvement.PEREMPTION, -quantite,
                        "Retrait du lot " + lot.getNumeroLot() + " périmé le " + lot.getDatePeremption().format(FR));
                traites++;
            }
        }
        return traites;
    }

    @Transactional(readOnly = true)
    public List<MouvementDto> mouvements(TypeMouvement type) {
        List<MouvementStock> liste = type == null
                ? mouvementRepository.findTop300ByOrderByDateMouvementDesc()
                : mouvementRepository.findTop300ByTypeOrderByDateMouvementDesc(type);
        return liste.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AlerteStockDto> alertes() {
        LocalDate today = LocalDate.now();
        Map<Long, List<LotMedicament>> lots = lotsParMedicament();
        List<AlerteStockDto> alertes = new ArrayList<>();
        for (Medicament m : medicamentRepository.findAllByOrderByNomCommercialAsc()) {
            if (!m.isActif()) continue;
            long stock = stockDisponible(lots.getOrDefault(m.getId(), List.of()), today);
            if (stock == 0) {
                alertes.add(new AlerteStockDto("RUPTURE", "CRITIQUE", m.getId(), m.libelle(), null, null, 0, null,
                        "Rupture de stock : aucune unité disponible."));
            } else if (stock < m.getSeuilAlerte()) {
                alertes.add(new AlerteStockDto("STOCK_BAS", "ATTENTION", m.getId(), m.libelle(), null, null, stock, null,
                        "Stock bas : " + stock + " unité(s), seuil fixé à " + m.getSeuilAlerte() + "."));
            }
        }
        for (List<LotMedicament> lotsMed : lots.values()) {
            for (LotMedicament lot : lotsMed) {
                if (lot.getQuantiteRestante() <= 0) continue;
                long jours = ChronoUnit.DAYS.between(today, lot.getDatePeremption());
                if (jours < 0) {
                    alertes.add(new AlerteStockDto("PERIME", "CRITIQUE", lot.getMedicament().getId(), lot.getMedicament().libelle(),
                            lot.getId(), lot.getNumeroLot(), lot.getQuantiteRestante(), lot.getDatePeremption(),
                            "Lot périmé depuis le " + lot.getDatePeremption().format(FR) + " : à retirer du stock."));
                } else if (jours <= JOURS_ALERTE_PEREMPTION) {
                    alertes.add(new AlerteStockDto("PEREMPTION_PROCHE", "ATTENTION", lot.getMedicament().getId(), lot.getMedicament().libelle(),
                            lot.getId(), lot.getNumeroLot(), lot.getQuantiteRestante(), lot.getDatePeremption(),
                            "Péremption dans " + jours + " jour(s), le " + lot.getDatePeremption().format(FR) + "."));
                }
            }
        }
        alertes.sort(Comparator.comparing((AlerteStockDto a) -> !"CRITIQUE".equals(a.getNiveau()))
                .thenComparing(AlerteStockDto::getMedicamentNom));
        return alertes;
    }

    @Transactional(readOnly = true)
    public TableauBordPharmacieDto tableauDeBord() {
        LocalDate today = LocalDate.now();
        Map<Long, List<LotMedicament>> lots = lotsParMedicament();
        TableauBordPharmacieDto t = new TableauBordPharmacieDto();
        long unites = 0;
        BigDecimal valeur = BigDecimal.ZERO;
        long actifs = 0;
        for (Medicament m : medicamentRepository.findAll()) {
            if (!m.isActif()) continue;
            actifs++;
            long stock = stockDisponible(lots.getOrDefault(m.getId(), List.of()), today);
            unites += stock;
            valeur = valeur.add(m.getPrixUnitaire().multiply(BigDecimal.valueOf(stock)));
        }
        t.setMedicamentsActifs(actifs);
        t.setUnitesEnStock(unites);
        t.setValeurStock(valeur);
        List<AlerteStockDto> alertes = alertes();
        t.setRuptures(alertes.stream().filter(a -> a.getType().equals("RUPTURE")).count());
        t.setStocksBas(alertes.stream().filter(a -> a.getType().equals("STOCK_BAS")).count());
        t.setLotsPerimes(alertes.stream().filter(a -> a.getType().equals("PERIME")).count());
        t.setPeremptionsProches(alertes.stream().filter(a -> a.getType().equals("PEREMPTION_PROCHE")).count());
        t.setOrdonnancesADelivrer(ordonnanceRepository.aDelivrer().size());
        t.setDelivrancesAujourdhui(delivranceRepository.countByDateDelivranceAfter(today.atStartOfDay()));
        t.setFournisseurs(fournisseurRepository.findAll().stream().filter(Fournisseur::isActif).count());
        return t;
    }

    // ══ Ordonnances et délivrance ═══════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<OrdonnanceDto> ordonnancesADelivrer() {
        return ordonnanceRepository.aDelivrer().stream().map(o -> ordonnanceService.toDto(o, true)).toList();
    }

    /**
     * Délivre une ordonnance en prélevant les lots non périmés du plus proche de la péremption au plus lointain (FEFO).
     * L'opération est transactionnelle : en cas d'erreur, aucun stock n'est modifié.
     */
    @Transactional
    public DelivranceDto delivrer(DelivranceRequest req) {
        Ordonnance ordonnance = ordonnanceRepository.findById(req.getOrdonnanceId())
                .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable"));
        if (ordonnance.getLignes().isEmpty()) {
            throw new IllegalStateException("Cette ordonnance n'est pas structurée : elle ne peut pas être délivrée par la pharmacie.");
        }
        if (ordonnance.getStatutDelivrance() == StatutDelivrance.COMPLETE) {
            throw new IllegalStateException("Cette ordonnance a déjà été entièrement délivrée.");
        }

        Map<Long, Integer> demandes = new HashMap<>();
        if (req.getLignes() != null) {
            req.getLignes().forEach(l -> demandes.put(l.getLigneOrdonnanceId(), l.getQuantite()));
        }

        LocalDate today = LocalDate.now();
        Delivrance delivrance = Delivrance.builder()
                .ordonnance(ordonnance)
                .pharmacien(utilisateurCourant.get().orElse(null))
                .statut(StatutDelivrance.PARTIELLE)
                .build();
        List<String> avertissements = new ArrayList<>();
        List<Medicament> seuilsFranchis = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (LigneOrdonnance ligne : ordonnance.getLignes()) {
            int demande = demandes.isEmpty()
                    ? ligne.resteADelivrer()
                    : Math.min(demandes.getOrDefault(ligne.getId(), 0), ligne.resteADelivrer());
            if (demande <= 0) continue;

            Medicament m = ligne.getMedicament();
            long stockAvant = lotRepository.stockDisponible(m.getId(), today);
            int restant = demande;
            for (LotMedicament lot : lotRepository.lotsDisponiblesFefo(m.getId(), today)) {
                if (restant == 0) break;
                int pris = Math.min(restant, lot.getQuantiteRestante());
                lot.setQuantiteRestante(lot.getQuantiteRestante() - pris);
                lotRepository.save(lot);
                mouvement(lot, TypeMouvement.SORTIE, -pris, "Délivrance de l'ordonnance n° " + ordonnance.getId());
                delivrance.getLignes().add(LigneDelivrance.builder()
                        .delivrance(delivrance)
                        .ligneOrdonnance(ligne)
                        .lot(lot)
                        .quantite(pris)
                        .prixUnitaire(m.getPrixUnitaire())
                        .build());
                total = total.add(m.getPrixUnitaire().multiply(BigDecimal.valueOf(pris)));
                restant -= pris;
            }
            int servi = demande - restant;
            ligne.setQuantiteDelivree(ligne.getQuantiteDelivree() + servi);
            if (restant > 0) {
                avertissements.add(m.libelle() + " : stock insuffisant, " + servi + " sur " + demande + " délivré(s).");
            }
            long stockApres = stockAvant - servi;
            if (servi > 0 && stockAvant >= m.getSeuilAlerte() && stockApres < m.getSeuilAlerte()) {
                seuilsFranchis.add(m);
            }
        }

        if (delivrance.getLignes().isEmpty()) {
            throw new IllegalStateException("Aucun médicament n'a pu être délivré : stock indisponible pour les quantités demandées.");
        }

        boolean complete = ordonnance.getLignes().stream().allMatch(l -> l.resteADelivrer() == 0);
        StatutDelivrance statut = complete ? StatutDelivrance.COMPLETE : StatutDelivrance.PARTIELLE;
        ordonnance.setStatutDelivrance(statut);
        delivrance.setStatut(statut);
        delivrance.setMontantTotal(total);
        ordonnanceRepository.save(ordonnance);
        Delivrance saved = delivranceRepository.save(delivrance);

        Patient patient = ordonnance.getConsultation().getPatient();
        if (req.isFacturer() && total.signum() > 0) {
            FactureDto f = new FactureDto();
            f.setPatientId(patient.getId());
            f.setMedecinId(ordonnance.getConsultation().getMedecin().getId());
            f.setNotes("Délivrance pharmacie — ordonnance n° " + ordonnance.getId());
            f.setLignes(saved.getLignes().stream().map(l -> {
                FactureDto.LigneFactureDto lf = new FactureDto.LigneFactureDto();
                lf.setDescription(l.getLigneOrdonnance().getMedicament().libelle() + " — lot " + l.getLot().getNumeroLot());
                lf.setQuantite(l.getQuantite());
                lf.setPrixUnitaire(l.getPrixUnitaire());
                return lf;
            }).collect(Collectors.toList()));
            FactureDto facture = factureService.create(f);
            factureRepository.findById(facture.getId()).ifPresent(saved::setFacture);
            delivranceRepository.save(saved);
        }

        if (patient.getUtilisateur() != null) {
            notificationService.creer(patient.getUtilisateur().getId(),
                    complete ? "Ordonnance délivrée" : "Ordonnance partiellement délivrée",
                    complete
                            ? "Vos médicaments de l'ordonnance n° " + ordonnance.getId() + " ont été délivrés par la pharmacie."
                            : "Une partie de votre ordonnance n° " + ordonnance.getId() + " a été délivrée ; le reste le sera dès réapprovisionnement.",
                    TypeNotification.ORDONNANCE_DELIVREE, ordonnance.getId(), "ORDONNANCE");
        }
        for (Medicament m : seuilsFranchis) {
            notifierPharmaciens("Stock bas : " + m.libelle(),
                    "Le stock de " + m.libelle() + " est passé sous le seuil d'alerte (" + m.getSeuilAlerte() + " unités).",
                    m.getId());
        }
        return toDto(saved, avertissements);
    }

    @Transactional(readOnly = true)
    public List<DelivranceDto> delivrances() {
        return delivranceRepository.findTop100ByOrderByDateDelivranceDesc().stream()
                .map(d -> toDto(d, List.of())).toList();
    }

    @Transactional(readOnly = true)
    public List<DelivranceDto> delivrancesOrdonnance(Long ordonnanceId) {
        Ordonnance o = ordonnanceRepository.findById(ordonnanceId)
                .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable"));
        utilisateurCourant.verifierAccesPatient(o.getConsultation().getPatient().getId());
        return delivranceRepository.findByOrdonnanceIdOrderByDateDelivranceDesc(ordonnanceId).stream()
                .map(d -> toDto(d, List.of())).toList();
    }

    public void notifierPharmaciens(String titre, String message, Long medicamentId) {
        for (Utilisateur u : utilisateurRepository.findByRoleAndActifTrue(Role.PHARMACIEN)) {
            notificationService.creer(u.getId(), titre, message, TypeNotification.ALERTE_STOCK, medicamentId, "MEDICAMENT");
        }
    }

    // ══ Outils internes ═════════════════════════════════════════════════════

    private void mouvement(LotMedicament lot, TypeMouvement type, int quantite, String motif) {
        mouvementRepository.save(MouvementStock.builder()
                .lot(lot)
                .type(type)
                .quantite(quantite)
                .motif(motif)
                .utilisateur(utilisateurCourant.get().orElse(null))
                .build());
    }

    private Map<Long, List<LotMedicament>> lotsParMedicament() {
        Map<Long, List<LotMedicament>> map = new LinkedHashMap<>();
        for (LotMedicament lot : lotRepository.findAllByOrderByDatePeremptionAsc()) {
            map.computeIfAbsent(lot.getMedicament().getId(), k -> new ArrayList<>()).add(lot);
        }
        return map;
    }

    private static long stockDisponible(List<LotMedicament> lots, LocalDate today) {
        return lots.stream().filter(l -> !l.getDatePeremption().isBefore(today))
                .mapToLong(LotMedicament::getQuantiteRestante).sum();
    }

    private Medicament getMedicament(Long id) {
        return medicamentRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Médicament introuvable"));
    }

    private Fournisseur getFournisseur(Long id) {
        return fournisseurRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable"));
    }

    private void appliquer(Medicament m, MedicamentDto dto) {
        m.setNomCommercial(dto.getNomCommercial().trim());
        m.setDci(dto.getDci());
        m.setForme(dto.getForme());
        m.setDosage(dto.getDosage());
        m.setPrixUnitaire(dto.getPrixUnitaire());
        m.setSeuilAlerte(dto.getSeuilAlerte());
        m.setSurOrdonnance(dto.isSurOrdonnance());
        m.setActif(dto.isActif());
    }

    private MedicamentDto toDto(Medicament m, List<LotMedicament> lots, boolean avecLots) {
        LocalDate today = LocalDate.now();
        MedicamentDto dto = new MedicamentDto();
        dto.setId(m.getId());
        dto.setCode(m.getCode());
        dto.setNomCommercial(m.getNomCommercial());
        dto.setDci(m.getDci());
        dto.setForme(m.getForme());
        dto.setDosage(m.getDosage());
        dto.setPrixUnitaire(m.getPrixUnitaire());
        dto.setSeuilAlerte(m.getSeuilAlerte());
        dto.setSurOrdonnance(m.isSurOrdonnance());
        dto.setActif(m.isActif());
        dto.setLibelle(m.libelle());
        long stock = stockDisponible(lots, today);
        dto.setStockDisponible(stock);
        dto.setEnRupture(stock == 0);
        dto.setSousSeuil(stock < m.getSeuilAlerte());
        dto.setProchainePeremption(lots.stream()
                .filter(l -> l.getQuantiteRestante() > 0 && !l.getDatePeremption().isBefore(today))
                .map(LotMedicament::getDatePeremption).min(LocalDate::compareTo).orElse(null));
        if (avecLots) {
            dto.setLots(lots.stream().map(this::toDto).toList());
        }
        return dto;
    }

    private LotDto toDto(LotMedicament l) {
        LotDto dto = new LotDto();
        dto.setId(l.getId());
        dto.setMedicamentId(l.getMedicament().getId());
        dto.setMedicamentNom(l.getMedicament().libelle());
        if (l.getFournisseur() != null) {
            dto.setFournisseurId(l.getFournisseur().getId());
            dto.setFournisseurNom(l.getFournisseur().getNom());
        }
        dto.setNumeroLot(l.getNumeroLot());
        dto.setQuantiteInitiale(l.getQuantiteInitiale());
        dto.setQuantiteRestante(l.getQuantiteRestante());
        dto.setDatePeremption(l.getDatePeremption());
        dto.setDateReception(l.getDateReception());
        dto.setPrixAchat(l.getPrixAchat());
        dto.setPerime(l.estPerime());
        dto.setJoursAvantPeremption(ChronoUnit.DAYS.between(LocalDate.now(), l.getDatePeremption()));
        return dto;
    }

    private FournisseurDto toDto(Fournisseur f) {
        FournisseurDto dto = new FournisseurDto();
        dto.setId(f.getId());
        dto.setNom(f.getNom());
        dto.setTelephone(f.getTelephone());
        dto.setEmail(f.getEmail());
        dto.setAdresse(f.getAdresse());
        dto.setActif(f.isActif());
        return dto;
    }

    private MouvementDto toDto(MouvementStock m) {
        MouvementDto dto = new MouvementDto();
        dto.setId(m.getId());
        dto.setType(m.getType());
        dto.setQuantite(m.getQuantite());
        dto.setMotif(m.getMotif());
        dto.setDateMouvement(m.getDateMouvement());
        dto.setLotId(m.getLot().getId());
        dto.setNumeroLot(m.getLot().getNumeroLot());
        dto.setMedicamentId(m.getLot().getMedicament().getId());
        dto.setMedicamentNom(m.getLot().getMedicament().libelle());
        if (m.getUtilisateur() != null) {
            dto.setUtilisateurNom(m.getUtilisateur().getPrenom() + " " + m.getUtilisateur().getNom());
        }
        return dto;
    }

    private DelivranceDto toDto(Delivrance d, List<String> avertissements) {
        DelivranceDto dto = new DelivranceDto();
        Ordonnance o = d.getOrdonnance();
        Patient p = o.getConsultation().getPatient();
        dto.setId(d.getId());
        dto.setOrdonnanceId(o.getId());
        dto.setPatientNom(p.getPrenom() + " " + p.getNom());
        dto.setNumeroDossier(p.getNumeroDossier());
        dto.setMedecinNom("Dr " + o.getConsultation().getMedecin().getPrenom() + " " + o.getConsultation().getMedecin().getNom());
        if (d.getPharmacien() != null) {
            dto.setPharmacienNom(d.getPharmacien().getPrenom() + " " + d.getPharmacien().getNom());
        }
        dto.setStatut(d.getStatut());
        dto.setMontantTotal(d.getMontantTotal());
        if (d.getFacture() != null) {
            dto.setFactureId(d.getFacture().getId());
            dto.setNumeroFacture(d.getFacture().getNumeroFacture());
        }
        dto.setDateDelivrance(d.getDateDelivrance());
        dto.setLignes(d.getLignes().stream().map(l -> {
            DelivranceDto.Ligne ld = new DelivranceDto.Ligne();
            ld.setMedicamentNom(l.getLigneOrdonnance().getMedicament().libelle());
            ld.setNumeroLot(l.getLot().getNumeroLot());
            ld.setDatePeremption(l.getLot().getDatePeremption());
            ld.setQuantite(l.getQuantite());
            ld.setPrixUnitaire(l.getPrixUnitaire());
            ld.setTotal(l.getPrixUnitaire().multiply(BigDecimal.valueOf(l.getQuantite())));
            return ld;
        }).toList());
        dto.setAvertissements(new ArrayList<>(avertissements));
        return dto;
    }
}
