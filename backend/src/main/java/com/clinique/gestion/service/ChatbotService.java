package com.clinique.gestion.service;

import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.RendezVous;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.entity.StatutPaiement;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final PatientRepository      patientRepository;
    private final MedecinRepository      medecinRepository;
    private final RendezVousRepository   rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final UtilisateurRepository  utilisateurRepository;
    private final OrdonnanceRepository   ordonnanceRepository;
    private final FactureRepository      factureRepository;
    private final ExamenLaboratoireRepository examenRepository;

    @Value("${app.ai.api-url:}")  private String aiApiUrl;
    @Value("${app.ai.api-key:}")  private String aiApiKey;
    @Value("${app.ai.model:llama3-8b-8192}") private String aiModel;

    // ── POINT D'ENTRÉE PRINCIPAL ──────────────────────────────────────────

    public ChatbotResponse repondre(String message, String contexte, String role, String userName) {
        // 1. Construire le contexte clinique dynamique
        String cliniqueContext = buildCliniqueContext(role);

        // 2. Construire le system prompt adapté au rôle
        String systemPrompt = buildSystemPrompt(role, userName, cliniqueContext);

        // 3. Appeler Groq
        if (aiApiUrl != null && !aiApiUrl.isBlank() && aiApiKey != null && !aiApiKey.isBlank()) {
            try {
                return appelerGroq(message, systemPrompt);
            } catch (Exception e) {
                // Fallback sur les règles
            }
        }
        return new ChatbotResponse(reponseRegles(message, role), "REGLES");
    }

    // Surcharge pour compatibilité avec l'ancien code
    public ChatbotResponse repondre(String message, String contexte) {
        return repondre(message, contexte, "PATIENT", "");
    }

    // ── CONSTRUCTION DU SYSTEM PROMPT ────────────────────────────────────

    private String buildSystemPrompt(String role, String userName, String context) {
        String name = (userName != null && !userName.isBlank()) ? userName : "utilisateur";

        return switch (role == null ? "PATIENT" : role.toUpperCase()) {
            case "MEDECIN" -> """
                Tu es MediAssist, l'assistant IA intelligent intégré à la plateforme MediCare pour les médecins.
                Tu t'adresses au Dr %s, médecin de la clinique.
                
                DONNÉES TEMPS RÉEL DE LA CLINIQUE :
                %s
                
                TON RÔLE :
                - Aide le médecin à consulter ses rendez-vous et patients
                - Réponds aux questions médicales générales (sans remplacer un avis clinique)
                - Aide à rédiger des notes, résumés de consultation, ordonnances types
                - Fournis des informations sur les protocoles cliniques
                - Réponds en français, de manière professionnelle et concise
                - Tu peux suggérer des diagnostics différentiels si demandé
                - Tu n'as pas accès aux dossiers médicaux confidentiels des patients individuels
                
                LIMITATIONS : Ne donne jamais de diagnostic définitif. Pour les urgences, renvoie vers le SAMU (15).
                Réponds TOUJOURS en français.
                """.formatted(name, context);

            case "ADMIN" -> """
                Tu es MediAssist, l'assistant IA de la plateforme d'administration MediCare.
                Tu t'adresses à %s, administrateur de la clinique.
                
                DONNÉES TEMPS RÉEL DE LA CLINIQUE :
                %s
                
                TON RÔLE :
                - Aide à analyser les statistiques et performances de la clinique
                - Réponds aux questions sur la gestion : patients, médecins, rendez-vous, utilisateurs
                - Donne des recommandations sur l'organisation et l'optimisation
                - Aide à interpréter les données et tendances
                - Réponds de manière précise, data-driven et professionnelle
                
                Réponds TOUJOURS en français.
                """.formatted(name, context);

            case "SECRETAIRE" -> """
                Tu es MediAssist, l'assistant IA de la clinique MediCare pour le secrétariat.
                Tu t'adresses à %s, secrétaire médicale.
                
                DONNÉES TEMPS RÉEL :
                %s
                
                TON RÔLE :
                - Aide à gérer les rendez-vous et le planning
                - Réponds aux questions sur les procédures d'accueil
                - Aide à rédiger des communications patients
                - Fournis les informations sur les médecins disponibles
                
                Réponds TOUJOURS en français.
                """.formatted(name, context);

            default -> // PATIENT
                """
                Tu es MediAssist, l'assistant santé de la clinique MediCare.
                Tu t'adresses à %s, patient de la clinique.
                
                INFORMATIONS CLINIQUE :
                %s
                
                TON RÔLE :
                - Aide le patient à naviguer dans la plateforme (RDV, dossier, historique)
                - Réponds aux questions sur les services de la clinique
                - Fournis des informations de santé générales et préventives
                - Oriente vers le bon spécialiste selon les symptômes décrits
                - Sois rassurant, empathique et clair
                - Pour les urgences vitales, renvoie immédiatement vers le 15 (SAMU)
                
                IMPORTANT : Tu n'es pas médecin, tes réponses sont informatives uniquement.
                Réponds TOUJOURS en français.
                """.formatted(name, context);
        };
    }

    // ── CONTEXTE CLINIQUE DYNAMIQUE ───────────────────────────────────────

    private String buildCliniqueContext(String role) {
        StringBuilder sb = new StringBuilder();

        // Stats globales
        long nbPatients      = patientRepository.count();
        long nbMedecins      = medecinRepository.count();
        long nbMedecinsDispo = medecinRepository.countByDisponibleTrue();
        long nbRdv           = rendezVousRepository.count();
        long nbPlanifies     = rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE);
        long nbConfirmes     = rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME);
        long nbAnnules       = rendezVousRepository.countByStatut(StatutRendezVous.ANNULE);
        long nbConsultations = consultationRepository.count();

        sb.append("- Patients : ").append(nbPatients).append("\n");
        sb.append("- Médecins : ").append(nbMedecins).append(" (").append(nbMedecinsDispo).append(" disponibles)\n");
        sb.append("- Rendez-vous : ").append(nbRdv).append(" total | ").append(nbPlanifies).append(" planifiés | ").append(nbConfirmes).append(" confirmés | ").append(nbAnnules).append(" annulés\n");
        sb.append("- Consultations : ").append(nbConsultations).append("\n");

        // Facturation sommaire
        try {
            long nbFactures = factureRepository.count();
            long nbPayees   = factureRepository.countByStatut(StatutPaiement.PAYE);
            java.math.BigDecimal revenus = factureRepository.sumRevenusTotal();
            sb.append("- Factures : ").append(nbFactures).append(" total, ")
              .append(nbPayees).append(" payées");
            if (revenus != null) sb.append(", revenus : ").append(revenus).append(" €");
            sb.append("\n");
        } catch (Exception ignored) {}

        // Examens
        try {
            long nbExamens   = examenRepository.count();
            long nbResultats = examenRepository.countByStatut(StatutExamen.RESULTAT_DISPONIBLE);
            sb.append("- Examens : ").append(nbExamens).append(" total, ")
              .append(nbResultats).append(" résultats disponibles\n");
        } catch (Exception ignored) {}

        // Médecins disponibles
        List<Medecin> medecins = medecinRepository.findAll();
        sb.append("- Équipe médicale : ");
        sb.append(medecins.stream()
            .map(m -> "Dr " + m.getPrenom() + " " + m.getNom() + " (" + m.getSpecialite() + (m.isDisponible() ? ", dispo" : ", indispo") + ")")
            .collect(Collectors.joining("; ")));
        sb.append("\n");

        // RDV du jour
        LocalDateTime debut = LocalDate.now().atStartOfDay();
        LocalDateTime fin   = debut.plusDays(1);
        List<RendezVous> rdvAujourd = rendezVousRepository.findByDateHeureBetween(debut, fin);
        sb.append("- RDV aujourd'hui (").append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append(") : ").append(rdvAujourd.size()).append("\n");

        // Horaires
        sb.append("- Horaires clinique : Lun-Ven 08h-18h, Sam 09h-13h\n");

        return sb.toString();
    }

    // ── APPEL GROQ (OpenAI-compatible) ────────────────────────────────────

    @SuppressWarnings("unchecked")
    private ChatbotResponse appelerGroq(String message, String systemPrompt) {
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(aiApiKey);

        Map<String, Object> body = Map.of(
            "model", aiModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", message)
            ),
            "max_tokens", 800,
            "temperature", 0.7
        );

        ResponseEntity<Map> response = rt.exchange(
            aiApiUrl, HttpMethod.POST,
            new HttpEntity<>(body, headers), Map.class
        );

        Map<String, Object> result = response.getBody();
        if (result != null && result.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
                return new ChatbotResponse((String) msg.get("content"), "GROQ");
            }
        }
        throw new RuntimeException("Réponse Groq vide");
    }

    // ── FALLBACK RÈGLES ───────────────────────────────────────────────────

    private String reponseRegles(String message, String role) {
        if (message == null) return aide(role);
        String t = message.toLowerCase(Locale.FRENCH).trim();

        if (t.matches("(bonjour|salut|hello|bonsoir|hey).*"))
            return "Bonjour ! Je suis MediAssist, votre assistant clinique. Comment puis-je vous aider ?";
        if (t.contains("stat") || t.contains("chiffre")) return statsResume();
        if (t.contains("médecin") || t.contains("docteur")) return listeMedecins();
        if (t.contains("rdv") || t.contains("rendez")) {
            if ("MEDECIN".equalsIgnoreCase(role)) {
                return "Vous avez actuellement "
                    + rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE)
                    + " rendez-vous planifiés et "
                    + rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME)
                    + " confirmés dans le système.";
            }
            return rdvResume();
        }
        if (t.contains("horaire")) return "La clinique est ouverte Lun-Ven 08h-18h, Sam 09h-13h.";
        if (t.contains("urgence")) return "En cas d'urgence vitale : composez le 15 (SAMU).";
        if (t.contains("patient")) {
            long nb = patientRepository.count();
            return "La clinique compte " + nb + " patient" + (nb > 1 ? "s" : "") + " enregistré" + (nb > 1 ? "s" : "") + ".";
        }
        return aide(role);
    }

    private String aide(String role) {
        if ("MEDECIN".equals(role))
            return "Je peux vous aider sur : vos rendez-vous, vos patients, informations médicales générales, rédaction de notes. Posez votre question !";
        return "Je peux vous aider sur : statistiques, médecins disponibles, rendez-vous, horaires. Posez votre question !";
    }

    private String statsResume() {
        return String.format("📊 Clinique : %d patients, %d médecins (%d dispo.), %d RDV, %d consultations.",
            patientRepository.count(), medecinRepository.count(), medecinRepository.countByDisponibleTrue(),
            rendezVousRepository.count(), consultationRepository.count());
    }

    private String listeMedecins() {
        return "👨‍⚕️ " + medecinRepository.findAll().stream()
            .map(m -> "Dr "+m.getPrenom()+" "+m.getNom()+" ("+m.getSpecialite()+(m.isDisponible()?" ✅":" ❌")+")")
            .collect(Collectors.joining(", "));
    }

    private String rdvResume() {
        return String.format("📅 RDV : %d total, %d planifiés, %d confirmés.",
            rendezVousRepository.count(),
            rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE),
            rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME));
    }

    // ── STATISTIQUES ──────────────────────────────────────────────────────

    public StatistiqueDto statistiques() {
        long totalRdv  = rendezVousRepository.count();
        long planifies = rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE);
        long confirmes = rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME);
        long annules   = rendezVousRepository.countByStatut(StatutRendezVous.ANNULE);
        long termines  = rendezVousRepository.countByStatut(StatutRendezVous.TERMINE);
        double tauxConf = totalRdv > 0 ? Math.round(confirmes * 100.0 / totalRdv * 10) / 10.0 : 0;
        double tauxAnn  = totalRdv > 0 ? Math.round(annules  * 100.0 / totalRdv * 10) / 10.0 : 0;

        java.math.BigDecimal revenusTotal = null;
        try { revenusTotal = factureRepository.sumRevenusTotal(); } catch (Exception ignored) {}

        return StatistiqueDto.builder()
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
            .utilisateurs(utilisateurRepository.count())
            .tauxConfirmation(tauxConf)
            .tauxAnnulation(tauxAnn)
            .facturesTotal(factureRepository.count())
            .facturesPayees(factureRepository.countByStatut(StatutPaiement.PAYE))
            .facturesEnAttente(factureRepository.countByStatut(StatutPaiement.EN_ATTENTE))
            .revenusTotal(revenusTotal != null ? revenusTotal : java.math.BigDecimal.ZERO)
            .examensTotal(examenRepository.count())
            .build();
    }

    public StatistiqueDto statistiquesMedecin(Long medecinId) {
        long rdvs = rendezVousRepository.findByMedecinIdOrderByDateHeureAsc(medecinId).size();
        long consultations = consultationRepository.findByMedecinIdOrderByDateConsultationDesc(medecinId).size();
        long patients = patientRepository.findPatientsByMedecinId(medecinId).size();
        long planifies = rendezVousRepository.findByMedecinIdOrderByDateHeureAsc(medecinId)
            .stream().filter(r -> r.getStatut() == StatutRendezVous.PLANIFIE).count();
        long confirmes = rendezVousRepository.findByMedecinIdOrderByDateHeureAsc(medecinId)
            .stream().filter(r -> r.getStatut() == StatutRendezVous.CONFIRME).count();
        return StatistiqueDto.builder()
            .patients(patients).medecins(1).medecinsDisponibles(1)
            .rendezVous(rdvs).consultations(consultations)
            .rendezVousPlanifies(planifies).rendezVousConfirmes(confirmes)
            .rendezVousAnnules(0).rendezVousTermines(0)
            .utilisateurs(0).tauxConfirmation(0).tauxAnnulation(0)
            .build();
    }
}
