package com.clinique.gestion.service;

import com.clinique.gestion.dto.ia.AnalyseIADto;
import com.clinique.gestion.dto.ia.JournalIADto;
import com.clinique.gestion.dto.ia.PrevisionsDto;
import com.clinique.gestion.dto.ia.StatutIADto;
import com.clinique.gestion.dto.ia.TriageResultatDto;
import com.clinique.gestion.entity.AnalyseIA;
import com.clinique.gestion.entity.Consultation;
import com.clinique.gestion.entity.ExamenLaboratoire;
import com.clinique.gestion.entity.FonctionIA;
import com.clinique.gestion.entity.JournalIA;
import com.clinique.gestion.entity.LotMedicament;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.Medicament;
import com.clinique.gestion.entity.NiveauUrgence;
import com.clinique.gestion.entity.Ordonnance;
import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.RendezVous;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.entity.TriageSymptomes;
import com.clinique.gestion.entity.TypeAnalyseIA;
import com.clinique.gestion.entity.TypeMouvement;
import com.clinique.gestion.repository.AnalyseIARepository;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.ExamenLaboratoireRepository;
import com.clinique.gestion.repository.JournalIARepository;
import com.clinique.gestion.repository.LotMedicamentRepository;
import com.clinique.gestion.repository.MedecinRepository;
import com.clinique.gestion.repository.MedicamentRepository;
import com.clinique.gestion.repository.MouvementStockRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.RendezVousRepository;
import com.clinique.gestion.repository.TriageSymptomesRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Module M5 — IA et aide à la décision : pré-triage des symptômes, résumé de dossier, aide à l'interprétation
 * des résultats et prévisions d'activité. Chaque fonction utilise le modèle de langage s'il est configuré et
 * bascule sinon sur un moteur de règles local ; les données envoyées au modèle sont pseudonymisées.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantIAService {

    public static final String AVERTISSEMENT =
            "Ces suggestions sont générées automatiquement et ne remplacent pas un avis médical.";
    private static final String MEDECINE_GENERALE = "Médecine générale";
    private static final DateTimeFormatter FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ClientIA clientIA;
    private final JournalIAService journal;
    private final ObjectMapper objectMapper;
    private final UtilisateurCourant utilisateurCourant;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final RendezVousRepository rendezVousRepository;
    private final TriageSymptomesRepository triageRepository;
    private final AnalyseIARepository analyseRepository;
    private final JournalIARepository journalRepository;
    private final MedicamentRepository medicamentRepository;
    private final LotMedicamentRepository lotRepository;
    private final MouvementStockRepository mouvementRepository;

    // ══ Pré-triage des symptômes (patient) ═══════════════════════════════════

    @Transactional
    public TriageResultatDto trier(String symptomes) {
        Patient patient = utilisateurCourant.patientConnecte()
                .orElseThrow(() -> new AccessDeniedException("Le pré-diagnostic est réservé aux patients"));
        long debut = System.nanoTime();
        List<String> specialites = specialitesDisponibles();

        Triage regles = trierParRegles(symptomes, patient, specialites);
        Triage resultat = regles;
        if (clientIA.estConfigure()) {
            try {
                resultat = trierParModele(symptomes, patient, specialites);
                // Filet de sécurité : un signe d'alerte détecté par les règles n'est jamais minimisé par le modèle.
                if (regles.urgence == NiveauUrgence.URGENCE_VITALE && resultat.urgence != NiveauUrgence.URGENCE_VITALE) {
                    resultat = new Triage(resultat.specialite, NiveauUrgence.URGENCE_VITALE, regles.justification, regles.conseils, "GROQ");
                }
                journal.tracer(FonctionIA.TRIAGE, "GROQ", clientIA.modele(), debut, true, null);
            } catch (Exception e) {
                log.warn("Pré-triage IA indisponible, moteur de règles utilisé : {}", e.getMessage());
                journal.tracer(FonctionIA.TRIAGE, "GROQ", clientIA.modele(), debut, false, e.getMessage());
                resultat = regles;
            }
        }
        if (resultat.source.equals("REGLES")) {
            journal.tracer(FonctionIA.TRIAGE, "REGLES", "règles locales", debut, true, null);
        }

        TriageSymptomes saved = triageRepository.save(TriageSymptomes.builder()
                .patient(patient)
                .symptomes(symptomes.trim())
                .specialiteSuggeree(resultat.specialite)
                .niveauUrgence(resultat.urgence)
                .justification(tronquer(resultat.justification, 1000))
                .conseils(tronquer(resultat.conseils, 1000))
                .source(resultat.source)
                .build());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TriageResultatDto> mesTriages() {
        Patient patient = utilisateurCourant.patientConnecte()
                .orElseThrow(() -> new AccessDeniedException("Réservé aux patients"));
        return triageRepository.findTop20ByPatientIdOrderByDateTriageDesc(patient.getId()).stream().map(this::toDto).toList();
    }

    private record Triage(String specialite, NiveauUrgence urgence, String justification, String conseils, String source) {}

    private Triage trierParModele(String symptomes, Patient patient, List<String> specialites) throws Exception {
        String systeme = """
                Tu es un assistant de pré-orientation médicale d'une clinique. À partir des symptômes décrits par un patient,
                tu proposes la spécialité médicale la plus adaptée et un niveau d'urgence. Tu ne poses aucun diagnostic.
                Spécialités autorisées (choisis-en exactement une) : %s.
                Niveaux d'urgence autorisés : FAIBLE, MODERE, ELEVE, URGENCE_VITALE (signes de gravité : douleur thoracique,
                détresse respiratoire, perte de connaissance, déficit neurologique, hémorragie, idées suicidaires...).
                Réponds UNIQUEMENT avec un objet JSON de la forme :
                {"specialite": "...", "niveauUrgence": "...", "justification": "1 à 2 phrases", "conseils": "1 à 2 phrases"}
                """.formatted(String.join(", ", specialites));
        String reponse = clientIA.completer(systeme, profilPseudonymise(patient) + "\nSymptômes décrits : " + symptomes, 0.1, 400);
        JsonNode json = objectMapper.readTree(ClientIA.extraireJson(reponse));
        String specialite = json.path("specialite").asText(MEDECINE_GENERALE);
        if (specialites.stream().noneMatch(s -> s.equalsIgnoreCase(specialite))) {
            throw new IllegalStateException("Spécialité hors liste : " + specialite);
        }
        NiveauUrgence urgence = NiveauUrgence.valueOf(json.path("niveauUrgence").asText("MODERE").trim().toUpperCase());
        return new Triage(specialite, urgence, json.path("justification").asText(""), json.path("conseils").asText(""), "GROQ");
    }

    /** Moteur de règles local : mots-clés → spécialité, signes de gravité → niveau d'urgence. */
    private Triage trierParRegles(String symptomes, Patient patient, List<String> specialites) {
        String t = normaliser(symptomes);

        NiveauUrgence urgence;
        String justification;
        if (contient(t, "douleur thoracique", "douleur a la poitrine", "douleur dans la poitrine", "serrement dans la poitrine",
                "difficulte a respirer", "n'arrive plus a respirer", "j'etouffe", "etouffement", "perte de connaissance",
                "evanoui", "paralysie", "paralyse", "ne sent plus mon bras", "bouche deformee", "convulsion",
                "saignement abondant", "hemorragie", "vomit du sang", "idees suicidaires", "envie de mourir", "suicide",
                "gonflement de la gorge", "gorge qui gonfle")) {
            urgence = NiveauUrgence.URGENCE_VITALE;
            justification = "Les symptômes décrits comportent un signe de gravité qui nécessite une prise en charge immédiate.";
        } else if (contient(t, "forte fievre", "fievre elevee", "fievre a 39", "fievre a 40", "39 de fievre", "40 de fievre", "39°", "40°", "39 degres", "douleur intense", "tres forte douleur",
                "insupportable", "sang dans", "du sang", "fracture", "brulure grave", "malaise", "confusion")) {
            urgence = NiveauUrgence.ELEVE;
            justification = "Les symptômes décrits justifient une consultation rapide, idéalement dans la journée.";
        } else if (contient(t, "fievre", "douleur", "depuis plusieurs jours", "depuis une semaine", "vomissement", "diarrhee",
                "infection", "gonflement", "toux")) {
            urgence = NiveauUrgence.MODERE;
            justification = "Les symptômes décrits justifient une consultation dans les prochains jours.";
        } else {
            urgence = NiveauUrgence.FAIBLE;
            justification = "Aucun signe de gravité n'a été détecté dans votre description.";
        }

        Map<String, String[]> motsCles = new LinkedHashMap<>();
        motsCles.put("Cardiologie", new String[]{"thoracique", "poitrine", "palpitation", "coeur", "cardiaque", "tension", "hypertension", "essoufflement"});
        motsCles.put("Pneumologie", new String[]{"toux", "respir", "asthme", "bronch", "poumon", "crachat"});
        motsCles.put("Dermatologie", new String[]{"peau", "bouton", "eczema", "demangeaison", "acne", "plaque", "rougeur", "grain de beaute"});
        motsCles.put("Gastro-entérologie", new String[]{"ventre", "abdomen", "abdominal", "diarrhee", "nausee", "vomi", "estomac", "digestion", "constipation", "brulure d'estomac"});
        motsCles.put("Neurologie", new String[]{"migraine", "mal de tete", "maux de tete", "cephalee", "vertige", "engourdissement", "fourmillement", "convulsion", "paralysie"});
        motsCles.put("ORL", new String[]{"oreille", "gorge", "sinus", "nez bouche", "angine", "audition", "acouphene"});
        motsCles.put("Ophtalmologie", new String[]{"oeil", "yeux", "vision", "vue trouble", "paupiere"});
        motsCles.put("Rhumatologie", new String[]{"articulation", "genou", "au dos", "du dos", "le dos", "lombaire", "arthrose", "epaule", "tendinite"});
        motsCles.put("Gynécologie", new String[]{"regles", "grossesse", "enceinte", "gyneco", "menstru"});
        motsCles.put("Psychiatrie", new String[]{"anxiete", "angoisse", "depression", "insomnie", "stress", "idees noires"});

        String specialite = MEDECINE_GENERALE;
        int meilleur = 0;
        for (Map.Entry<String, String[]> e : motsCles.entrySet()) {
            int score = 0;
            for (String mot : e.getValue()) if (t.contains(mot)) score++;
            if (score > meilleur && specialites.stream().anyMatch(s -> normaliser(s).equals(normaliser(e.getKey())))) {
                meilleur = score;
                specialite = specialites.stream().filter(s -> normaliser(s).equals(normaliser(e.getKey()))).findFirst().orElse(e.getKey());
            }
        }
        if (patient.getDateNaissance() != null && Period.between(patient.getDateNaissance(), LocalDate.now()).getYears() < 15
                && specialites.stream().anyMatch(s -> normaliser(s).equals("pediatrie"))) {
            specialite = specialites.stream().filter(s -> normaliser(s).equals("pediatrie")).findFirst().orElse(specialite);
        }

        String conseils = switch (urgence) {
            case URGENCE_VITALE -> "Appelez immédiatement le 190 (SAMU) ou le 198 (Protection civile), ou rendez-vous aux urgences les plus proches. Ne prenez pas rendez-vous en ligne.";
            case ELEVE -> "Prenez rendez-vous dès aujourd'hui. Si les symptômes s'aggravent, contactez le 190 (SAMU).";
            case MODERE -> "Prenez rendez-vous dans les prochains jours et surveillez l'évolution de vos symptômes.";
            case FAIBLE -> "Vous pouvez prendre un rendez-vous de consultation classique.";
        };
        return new Triage(specialite, urgence, justification, conseils, "REGLES");
    }

    // ══ Résumé du dossier (médecin) ══════════════════════════════════════════

    @Transactional
    public AnalyseIADto resumerDossier(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient introuvable"));
        String donnees = donneesDossier(patient);
        long debut = System.nanoTime();
        String contenu = null;
        String source = "REGLES";
        if (clientIA.estConfigure()) {
            try {
                contenu = clientIA.completer("""
                        Tu es un assistant de synthèse médicale. Rédige pour le médecin un résumé du dossier ci-dessous, en français,
                        en 4 rubriques courtes : « Contexte », « Antécédents et allergies », « Historique récent », « Points de vigilance ».
                        Utilise uniquement les informations fournies, n'invente rien et ne pose pas de diagnostic.""",
                        donnees, 0.2, 700);
                source = "GROQ";
                journal.tracer(FonctionIA.RESUME_DOSSIER, source, clientIA.modele(), debut, true, null);
            } catch (Exception e) {
                log.warn("Résumé IA indisponible, synthèse locale : {}", e.getMessage());
                journal.tracer(FonctionIA.RESUME_DOSSIER, "GROQ", clientIA.modele(), debut, false, e.getMessage());
            }
        }
        if (contenu == null) {
            contenu = donnees;
            journal.tracer(FonctionIA.RESUME_DOSSIER, "REGLES", "règles locales", debut, true, null);
        }
        AnalyseIA analyse = analyseRepository.save(AnalyseIA.builder()
                .type(TypeAnalyseIA.RESUME_DOSSIER)
                .patient(patient)
                .contenu(contenu)
                .source(source)
                .modele(clientIA.modele())
                .demandeur(utilisateurCourant.get().orElse(null))
                .build());
        return toDto(analyse);
    }

    /** Synthèse structurée et pseudonymisée du dossier (aucun nom ni numéro de dossier). */
    private String donneesDossier(Patient p) {
        StringBuilder sb = new StringBuilder();
        sb.append("CONTEXTE\n").append("- ").append(profilPseudonymise(p)).append("\n");
        sb.append("\nANTÉCÉDENTS ET ALLERGIES\n");
        sb.append("- Antécédents : ").append(valeur(p.getAntecedents())).append("\n");
        sb.append("- Allergies : ").append(valeur(p.getAllergies())).append("\n");
        sb.append("- Groupe sanguin : ").append(valeur(p.getGroupeSanguin())).append("\n");

        List<Consultation> consultations = consultationRepository.findByPatientIdOrderByDateConsultationDesc(p.getId());
        sb.append("\nHISTORIQUE RÉCENT\n");
        if (consultations.isEmpty()) {
            sb.append("- Aucune consultation enregistrée.\n");
        }
        consultations.stream().limit(5).forEach(c -> sb.append("- Consultation du ")
                .append(c.getDateConsultation().toLocalDate().format(FR)).append(" (").append(c.getMedecin().getSpecialite()).append(") : ")
                .append(valeur(c.getDiagnostic())).append(c.getTraitement() != null ? " — traitement : " + c.getTraitement() : "").append("\n"));
        List<Ordonnance> ordonnances = ordonnanceRepository.findByConsultationPatientIdOrderByDateEmissionDesc(p.getId());
        ordonnances.stream().limit(3).forEach(o -> sb.append("- Ordonnance du ").append(o.getDateEmission().format(FR)).append(" : ")
                .append(o.getMedicaments().replace("\n", " ; ")).append("\n"));
        List<ExamenLaboratoire> examens = examenRepository.findByPatientIdOrderByDateDemandeDesc(p.getId());
        examens.stream().limit(5).forEach(e -> sb.append("- Examen « ").append(e.getTypeExamen()).append(" » (")
                .append(libelle(e.getStatut())).append(")")
                .append(e.getResultatTexte() != null ? " : " + e.getResultatTexte().replace("\n", " ; ") : "").append("\n"));

        sb.append("\nPOINTS DE VIGILANCE\n");
        List<String> vigilance = new ArrayList<>();
        if (p.getAllergies() != null && !p.getAllergies().isBlank() && !normaliser(p.getAllergies()).startsWith("aucun")) {
            vigilance.add("Allergie connue : " + p.getAllergies() + " — à vérifier avant toute prescription.");
        }
        examens.stream().filter(e -> e.getResultatTexte() != null && contient(normaliser(e.getResultatTexte()), "eleve", "bas", "anormal", "augmente", "diminue"))
                .forEach(e -> vigilance.add("Résultat à surveiller : examen « " + e.getTypeExamen() + " »."));
        long enAttente = examens.stream().filter(e -> e.getResultatTexte() == null).count();
        if (enAttente > 0) vigilance.add(enAttente + " examen(s) en attente de résultat.");
        if (vigilance.isEmpty()) vigilance.add("Aucun point de vigilance particulier relevé dans le dossier.");
        vigilance.forEach(v -> sb.append("- ").append(v).append("\n"));
        return sb.toString();
    }

    // ══ Aide à l'interprétation d'un résultat (médecin) ══════════════════════

    @Transactional
    public AnalyseIADto interpreterExamen(Long examenId) {
        ExamenLaboratoire examen = examenRepository.findById(examenId)
                .orElseThrow(() -> new IllegalArgumentException("Examen introuvable"));
        if (examen.getResultatTexte() == null || examen.getResultatTexte().isBlank()) {
            throw new IllegalStateException("Le résultat de cet examen n'est pas encore disponible.");
        }
        long debut = System.nanoTime();
        String contenu = null;
        String source = "REGLES";
        String donnees = profilPseudonymise(examen.getPatient()) + "\nExamen : " + examen.getTypeExamen()
                + (examen.getDescription() != null ? " (" + examen.getDescription() + ")" : "")
                + "\nRésultat :\n" + examen.getResultatTexte();
        if (clientIA.estConfigure()) {
            try {
                contenu = clientIA.completer("""
                        Tu aides un médecin à relire un résultat d'analyse. En français et en quelques lignes : liste les valeurs
                        qui semblent hors des normes usuelles de l'adulte, leur signification générale possible et les points à
                        vérifier. N'établis aucun diagnostic et rappelle que l'interprétation finale revient au médecin.""",
                        donnees, 0.2, 600);
                source = "GROQ";
                journal.tracer(FonctionIA.INTERPRETATION_RESULTAT, source, clientIA.modele(), debut, true, null);
            } catch (Exception e) {
                log.warn("Interprétation IA indisponible, analyse locale : {}", e.getMessage());
                journal.tracer(FonctionIA.INTERPRETATION_RESULTAT, "GROQ", clientIA.modele(), debut, false, e.getMessage());
            }
        }
        if (contenu == null) {
            contenu = interpretationLocale(examen);
            journal.tracer(FonctionIA.INTERPRETATION_RESULTAT, "REGLES", "règles locales", debut, true, null);
        }
        AnalyseIA analyse = analyseRepository.save(AnalyseIA.builder()
                .type(TypeAnalyseIA.INTERPRETATION_RESULTAT)
                .patient(examen.getPatient())
                .examen(examen)
                .contenu(contenu)
                .source(source)
                .modele(clientIA.modele())
                .demandeur(utilisateurCourant.get().orElse(null))
                .build());
        return toDto(analyse);
    }

    private String interpretationLocale(ExamenLaboratoire examen) {
        List<String> anormales = new ArrayList<>();
        List<String> normales = new ArrayList<>();
        for (String ligne : examen.getResultatTexte().split("\\R")) {
            if (ligne.isBlank()) continue;
            String n = normaliser(ligne);
            if (contient(n, "eleve", "haut", "augmente", "bas", "diminue", "anormal", "hors norme", "positif")) {
                anormales.add(ligne.trim());
            } else {
                normales.add(ligne.trim());
            }
        }
        StringBuilder sb = new StringBuilder("Relecture automatique du résultat « ").append(examen.getTypeExamen()).append(" »\n\n");
        if (anormales.isEmpty()) {
            sb.append("Aucune valeur n'est signalée comme anormale dans le compte rendu (").append(normales.size())
                    .append(" valeur(s) relue(s)).\n");
        } else {
            sb.append("Valeurs signalées comme anormales :\n");
            anormales.forEach(a -> sb.append("- ").append(a).append("\n"));
            sb.append("\nÀ confronter au contexte clinique et aux antécédents du patient ; un contrôle peut être envisagé.\n");
        }
        sb.append("\nL'interprétation finale revient au médecin.");
        return sb.toString();
    }

    @Transactional
    public AnalyseIADto valider(Long analyseId) {
        AnalyseIA a = analyseRepository.findById(analyseId)
                .orElseThrow(() -> new IllegalArgumentException("Analyse introuvable"));
        a.setValidee(true);
        a.setValidePar(utilisateurCourant.requis());
        a.setDateValidation(LocalDateTime.now());
        return toDto(analyseRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AnalyseIADto> analysesPatient(Long patientId) {
        return analyseRepository.findTop20ByPatientIdOrderByDateGenerationDesc(patientId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyseIADto> analysesExamen(Long examenId) {
        return analyseRepository.findTop5ByExamenIdOrderByDateGenerationDesc(examenId).stream().map(this::toDto).toList();
    }

    // ══ Prévisions d'activité (administration) ═══════════════════════════════

    @Transactional(readOnly = true)
    public PrevisionsDto previsions() {
        final int semaines = 8;
        LocalDate today = LocalDate.now();
        LocalDateTime debutHistorique = today.minusWeeks(semaines).atStartOfDay();
        List<RendezVous> historique = rendezVousRepository.findByDateHeureBetween(debutHistorique, today.atStartOfDay());

        PrevisionsDto dto = new PrevisionsDto();
        dto.setSemainesAnalysees(semaines);
        dto.setRendezVousAnalyses(historique.size());
        long annulesTotal = historique.stream().filter(r -> r.getStatut() == StatutRendezVous.ANNULE).count();
        dto.setTauxAnnulation(pourcentage(annulesTotal, historique.size()));

        Map<DayOfWeek, List<RendezVous>> parJour = historique.stream().collect(Collectors.groupingBy(r -> r.getDateHeure().getDayOfWeek()));
        Map<DayOfWeek, Double> moyennes = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek j : DayOfWeek.values()) {
            List<RendezVous> rdvs = parJour.getOrDefault(j, List.of());
            double moyenne = Math.round(rdvs.size() * 10.0 / semaines) / 10.0;
            moyennes.put(j, moyenne);
            if (j == DayOfWeek.SUNDAY) continue;
            PrevisionsDto.JourSemaine js = new PrevisionsDto.JourSemaine();
            js.setJour(nomJour(j));
            js.setMoyenne(moyenne);
            js.setTauxAnnulation(pourcentage(rdvs.stream().filter(r -> r.getStatut() == StatutRendezVous.ANNULE).count(), rdvs.size()));
            dto.getParJour().add(js);
        }

        double moyenneGlobale = moyennes.entrySet().stream().filter(e -> e.getKey() != DayOfWeek.SUNDAY)
                .mapToDouble(Map.Entry::getValue).average().orElse(0);
        List<RendezVous> aVenir = rendezVousRepository.findByDateHeureBetween(today.atStartOfDay(), today.plusDays(7).atStartOfDay());
        for (int i = 0; i < 7; i++) {
            LocalDate d = today.plusDays(i);
            if (d.getDayOfWeek() == DayOfWeek.SUNDAY) continue;
            long planifies = aVenir.stream().filter(r -> r.getDateHeure().toLocalDate().equals(d) && r.getStatut() != StatutRendezVous.ANNULE).count();
            long prevus = Math.max(planifies, Math.round(moyennes.get(d.getDayOfWeek())));
            PrevisionsDto.JourPrevu jp = new PrevisionsDto.JourPrevu();
            jp.setDate(d);
            jp.setJour(nomJour(d.getDayOfWeek()));
            jp.setDejaPlanifies(planifies);
            jp.setPrevus(prevus);
            jp.setCharge(moyenneGlobale == 0 ? "NORMALE" : prevus > moyenneGlobale * 1.25 ? "FORTE" : prevus < moyenneGlobale * 0.75 ? "FAIBLE" : "NORMALE");
            dto.getProchainsJours().add(jp);
        }

        Map<String, List<RendezVous>> parCreneau = historique.stream()
                .collect(Collectors.groupingBy(r -> r.getDateHeure().getDayOfWeek() + "-" + r.getDateHeure().getHour()));
        parCreneau.values().stream()
                .filter(l -> l.size() >= 2)
                .map(l -> {
                    PrevisionsDto.CreneauRisque c = new PrevisionsDto.CreneauRisque();
                    c.setJour(nomJour(l.get(0).getDateHeure().getDayOfWeek()));
                    c.setHeure(l.get(0).getDateHeure().getHour());
                    c.setRendezVous(l.size());
                    c.setTauxAnnulation(pourcentage(l.stream().filter(r -> r.getStatut() == StatutRendezVous.ANNULE).count(), l.size()));
                    return c;
                })
                .filter(c -> c.getTauxAnnulation() > 0)
                .sorted(Comparator.comparingDouble(PrevisionsDto.CreneauRisque::getTauxAnnulation).reversed())
                .limit(5)
                .forEach(dto.getCreneauxARisque()::add);

        dto.setRisquesRupture(risquesRupture());
        dto.setRecommandations(recommandations(dto, moyenneGlobale));
        return dto;
    }

    /** Couverture du stock au rythme de consommation des 30 derniers jours. */
    private List<PrevisionsDto.RisqueRupture> risquesRupture() {
        LocalDate today = LocalDate.now();
        Map<Long, Long> sorties = new HashMap<>();
        for (Object[] row : mouvementRepository.totalParMedicamentDepuis(TypeMouvement.SORTIE, today.minusDays(30).atStartOfDay())) {
            sorties.put((Long) row[0], Math.abs(((Number) row[1]).longValue()));
        }
        List<PrevisionsDto.RisqueRupture> risques = new ArrayList<>();
        for (Medicament m : medicamentRepository.findAll()) {
            Long sortie = sorties.get(m.getId());
            if (!m.isActif() || sortie == null || sortie == 0) continue;
            long stock = lotRepository.stockDisponible(m.getId(), today);
            double parJour = sortie / 30.0;
            long couverture = (long) Math.floor(stock / parJour);
            if (couverture <= 30) {
                PrevisionsDto.RisqueRupture r = new PrevisionsDto.RisqueRupture();
                r.setMedicamentId(m.getId());
                r.setMedicament(m.libelle());
                r.setStock(stock);
                r.setConsommationJournaliere(Math.round(parJour * 100) / 100.0);
                r.setJoursCouverture(couverture);
                risques.add(r);
            }
        }
        risques.sort(Comparator.comparingLong(PrevisionsDto.RisqueRupture::getJoursCouverture));
        return risques;
    }

    private List<String> recommandations(PrevisionsDto dto, double moyenneGlobale) {
        List<String> recos = new ArrayList<>();
        dto.getParJour().stream().max(Comparator.comparingDouble(PrevisionsDto.JourSemaine::getMoyenne))
                .filter(j -> j.getMoyenne() > 0 && j.getMoyenne() > moyenneGlobale * 1.2)
                .ifPresent(j -> recos.add("Le " + j.getJour().toLowerCase() + " concentre la plus forte affluence (" + nombre(j.getMoyenne())
                        + " rendez-vous en moyenne) : prévoir un renfort à l'accueil et ouvrir des créneaux supplémentaires."));
        dto.getProchainsJours().stream().filter(j -> "FORTE".equals(j.getCharge())).findFirst()
                .ifPresent(j -> recos.add("Charge forte attendue le " + j.getJour().toLowerCase() + " " + j.getDate().format(FR)
                        + " (" + j.getPrevus() + " rendez-vous prévus)."));
        dto.getCreneauxARisque().stream().findFirst().filter(c -> c.getTauxAnnulation() >= 20)
                .ifPresent(c -> recos.add("Le créneau du " + c.getJour().toLowerCase() + " à " + c.getHeure() + " h présente "
                        + nombre(c.getTauxAnnulation()) + " % d'annulations : envoyer un rappel supplémentaire la veille."));
        if (dto.getTauxAnnulation() >= 15) {
            recos.add("Le taux d'annulation global (" + nombre(dto.getTauxAnnulation()) + " %) est élevé : proposer l'annulation en ligne pour libérer les créneaux plus tôt.");
        }
        dto.getRisquesRupture().stream().filter(r -> r.getJoursCouverture() <= 14).forEach(r ->
                recos.add(r.getMedicament() + " : " + r.getJoursCouverture() + " jour(s) de stock au rythme actuel, passer commande."));
        if (recos.isEmpty()) {
            recos.add("Activité stable : aucune action particulière n'est recommandée pour les 7 prochains jours.");
        }
        return recos;
    }

    // ══ Supervision ══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public StatutIADto statut() {
        StatutIADto s = new StatutIADto();
        s.setFournisseur("Groq");
        s.setModeleConnecte(clientIA.estConfigure());
        s.setModele(clientIA.modele());
        s.setAppelsTotal(journalRepository.count());
        s.setAppelsModele(journalRepository.countBySource("GROQ"));
        s.setAppelsRegles(journalRepository.countBySource("REGLES"));
        s.setEchecs(journalRepository.countBySuccesFalse());
        return s;
    }

    @Transactional(readOnly = true)
    public List<JournalIADto> journalAppels() {
        return journalRepository.findTop100ByOrderByDateAppelDesc().stream().map(this::toDto).toList();
    }

    // ══ Outils ═══════════════════════════════════════════════════════════════

    private List<String> specialitesDisponibles() {
        Set<String> specialites = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        specialites.add(MEDECINE_GENERALE);
        medecinRepository.findAll().stream().filter(Medecin::isDisponible).map(Medecin::getSpecialite)
                .filter(Objects::nonNull).forEach(specialites::add);
        return new ArrayList<>(specialites);
    }

    private List<Medecin> medecinsPour(String specialite) {
        List<Medecin> medecins = medecinRepository.findBySpecialiteContainingIgnoreCase(specialite).stream()
                .filter(Medecin::isDisponible).toList();
        if (medecins.isEmpty()) {
            medecins = medecinRepository.findBySpecialiteContainingIgnoreCase(MEDECINE_GENERALE).stream()
                    .filter(Medecin::isDisponible).toList();
        }
        return medecins;
    }

    private String profilPseudonymise(Patient p) {
        String age = p.getDateNaissance() == null ? "âge non renseigné"
                : Period.between(p.getDateNaissance(), LocalDate.now()).getYears() + " ans";
        String sexe = p.getSexe() == null ? "sexe non renseigné" : ("F".equalsIgnoreCase(p.getSexe()) ? "femme" : "homme");
        return "Patient : " + sexe + ", " + age + " ; antécédents : " + valeur(p.getAntecedents()) + " ; allergies : " + valeur(p.getAllergies()) + ".";
    }

    private static String libelle(StatutExamen statut) {
        return switch (statut) {
            case DEMANDE -> "demandé";
            case EN_COURS -> "en cours";
            case RESULTAT_DISPONIBLE -> "résultat disponible";
            case ANNULE -> "annulé";
        };
    }

    private static String valeur(String v) {
        return v == null || v.isBlank() ? "non renseigné" : v;
    }

    private static String normaliser(String s) {
        return Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").replace('’', '\'').replace("œ", "oe").toLowerCase(Locale.FRENCH);
    }

    private static boolean contient(String texte, String... mots) {
        for (String m : mots) if (texte.contains(m)) return true;
        return false;
    }

    /** Nombre au format français : « 4 », « 19,6 ». */
    private static String nombre(double v) {
        return v == Math.rint(v) ? String.valueOf((long) v) : String.format(Locale.FRENCH, "%.1f", v);
    }

    private static double pourcentage(long part, long total) {
        return total == 0 ? 0 : Math.round(part * 1000.0 / total) / 10.0;
    }

    private static String nomJour(DayOfWeek j) {
        String n = j.getDisplayName(TextStyle.FULL, Locale.FRENCH);
        return n.substring(0, 1).toUpperCase() + n.substring(1);
    }

    private static String tronquer(String s, int max) {
        return s == null ? null : s.length() <= max ? s : s.substring(0, max);
    }

    private TriageResultatDto toDto(TriageSymptomes t) {
        TriageResultatDto dto = new TriageResultatDto();
        dto.setId(t.getId());
        dto.setSymptomes(t.getSymptomes());
        dto.setSpecialite(t.getSpecialiteSuggeree());
        dto.setNiveauUrgence(t.getNiveauUrgence());
        dto.setJustification(t.getJustification());
        dto.setConseils(t.getConseils());
        dto.setSource(t.getSource());
        dto.setDateTriage(t.getDateTriage());
        dto.setAvertissement(AVERTISSEMENT);
        if (t.getNiveauUrgence() != NiveauUrgence.URGENCE_VITALE) {
            dto.setMedecins(medecinsPour(t.getSpecialiteSuggeree()).stream().map(m -> {
                TriageResultatDto.MedecinSuggere ms = new TriageResultatDto.MedecinSuggere();
                ms.setId(m.getId());
                ms.setNom("Dr " + m.getPrenom() + " " + m.getNom());
                ms.setSpecialite(m.getSpecialite());
                ms.setHoraires(m.getHoraires());
                return ms;
            }).toList());
        }
        return dto;
    }

    private AnalyseIADto toDto(AnalyseIA a) {
        AnalyseIADto dto = new AnalyseIADto();
        dto.setId(a.getId());
        dto.setType(a.getType());
        dto.setPatientId(a.getPatient().getId());
        dto.setExamenId(a.getExamen() != null ? a.getExamen().getId() : null);
        dto.setContenu(a.getContenu());
        dto.setSource(a.getSource());
        dto.setModele(a.getModele());
        dto.setValidee(a.isValidee());
        if (a.getValidePar() != null) {
            dto.setValideePar(a.getValidePar().getPrenom() + " " + a.getValidePar().getNom());
        }
        dto.setDateGeneration(a.getDateGeneration());
        dto.setDateValidation(a.getDateValidation());
        dto.setAvertissement(AVERTISSEMENT);
        return dto;
    }

    private JournalIADto toDto(JournalIA j) {
        JournalIADto dto = new JournalIADto();
        dto.setId(j.getId());
        dto.setFonction(j.getFonction());
        if (j.getUtilisateur() != null) {
            dto.setUtilisateur(j.getUtilisateur().getPrenom() + " " + j.getUtilisateur().getNom());
        }
        dto.setRole(j.getRole());
        dto.setSource(j.getSource());
        dto.setModele(j.getModele());
        dto.setDureeMs(j.getDureeMs());
        dto.setSucces(j.isSucces());
        dto.setErreur(j.getErreur());
        dto.setDateAppel(j.getDateAppel());
        return dto;
    }
}
