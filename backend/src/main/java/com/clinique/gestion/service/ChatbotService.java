package com.clinique.gestion.service;

import com.clinique.gestion.dto.ChatHistoryDto;
import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
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

    private final PatientRepository           patientRepository;
    private final MedecinRepository           medecinRepository;
    private final RendezVousRepository        rendezVousRepository;
    private final ConsultationRepository      consultationRepository;
    private final UtilisateurRepository       utilisateurRepository;
    private final OrdonnanceRepository        ordonnanceRepository;
    private final FactureRepository           factureRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final ChatMessageRepository       chatMessageRepository;

    @Value("${app.ai.api-url:}")  private String aiApiUrl;
    @Value("${app.ai.api-key:}")  private String aiApiKey;
    @Value("${app.ai.model:llama3-8b-8192}") private String aiModel;

    // ── POINT D'ENTRÉE PRINCIPAL ──────────────────────────────────────────

    public ChatbotResponse repondre(String message, String contexte, String role, String userName) {
        return repondre(message, contexte, role, userName, null, null);
    }

    public ChatbotResponse repondre(String message, String contexte, String role, String userName,
                                     Long utilisateurId, String sessionId) {
        String cliniqueContext = buildCliniqueContext(role);
        String systemPrompt    = buildSystemPrompt(role, userName, cliniqueContext);

        // Résoudre l'utilisateur si fourni
        Utilisateur utilisateur = null;
        if (utilisateurId != null) {
            utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        }
        String sid = (sessionId != null && !sessionId.isBlank()) ? sessionId : UUID.randomUUID().toString();

        // Sauvegarder le message utilisateur
        sauvegarderMessage(utilisateur, sid, "user", message, null);

        // Appeler Groq ou fallback
        ChatbotResponse response;
        if (aiApiUrl != null && !aiApiUrl.isBlank() && aiApiKey != null && !aiApiKey.isBlank()) {
            try {
                response = appelerGroq(message, systemPrompt);
            } catch (Exception e) {
                response = new ChatbotResponse(reponseRegles(message, role), "REGLES");
            }
        } else {
            response = new ChatbotResponse(reponseRegles(message, role), "REGLES");
        }

        // Sauvegarder la réponse bot
        sauvegarderMessage(utilisateur, sid, "bot", response.getReponse(), response.getSource());

        // Retourner le sessionId dans la réponse
        response.setSessionId(sid);
        return response;
    }
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

        // Salutations
        if (t.matches("(bonjour|salut|hello|bonsoir|hey|coucou).*"))
            return "Bonjour ! Je suis MediAssist, votre assistant santé de la clinique MediCare. Comment puis-je vous aider ? Je peux vous renseigner sur nos services, nos médecins, ou vous expliquer comment prendre un rendez-vous.";

        // Statistiques (uniquement pour admin)
        if ((t.contains("stat") || t.contains("chiffre") || t.contains("bilan")) && "ADMIN".equalsIgnoreCase(role))
            return statsResume();

        // Médecins
        if (t.contains("médecin") || t.contains("docteur") || t.contains("spécialiste"))
            return listeMedecins();

        // Prise de rendez-vous — réponse conversationnelle
        if (t.contains("rdv") || t.contains("rendez") || t.contains("appointment") || t.contains("consulter") || t.contains("prendre")) {
            if ("MEDECIN".equalsIgnoreCase(role)) {
                long planifies = rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE);
                long confirmes = rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME);
                return "Vous avez actuellement " + planifies + " rendez-vous planifié" + (planifies > 1 ? "s" : "")
                    + " et " + confirmes + " confirmé" + (confirmes > 1 ? "s" : "") + ". "
                    + "Consultez votre planning dans l'onglet **Rendez-vous** pour voir les détails.";
            }
            // Patient / visiteur : guide pratique
            return "Pour prendre un rendez-vous à la clinique MediCare, voici les étapes :\n\n"
                + "1️⃣ **Créez votre compte** sur notre site en cliquant sur « Prendre RDV »\n"
                + "2️⃣ **Connectez-vous** à votre espace patient\n"
                + "3️⃣ Rendez-vous dans **Mes rendez-vous** → **Nouveau rendez-vous**\n"
                + "4️⃣ **Choisissez votre médecin**, la date et l'heure qui vous conviennent\n"
                + "5️⃣ **Confirmez** — vous recevrez une notification de confirmation\n\n"
                + "Nos créneaux sont disponibles du lundi au vendredi de 8h à 18h, et le samedi de 9h à 13h.\n"
                + "Avez-vous besoin d'aide pour choisir le bon spécialiste ?";
        }

        // Horaires
        if (t.contains("horaire") || t.contains("ouvert") || t.contains("heure"))
            return "La clinique MediCare est ouverte :\n• **Lundi - Vendredi** : 08h00 - 18h00\n• **Samedi** : 09h00 - 13h00\n• **Dimanche** : fermé\n\nPour les urgences, composez le **15 (SAMU)**.";

        // Urgences
        if (t.contains("urgence") || t.contains("samu") || t.contains("urgent"))
            return "🚨 **En cas d'urgence vitale**, composez immédiatement le **15 (SAMU)**.\n\nPour une situation non vitale nécessitant une prise en charge rapide, notre clinique peut vous recevoir sans rendez-vous le matin dès 08h00.";

        // Services
        if (t.contains("service") || t.contains("soin") || t.contains("offre") || t.contains("propose"))
            return "La clinique MediCare vous propose :\n\n🩺 **Consultations médicales** — médecine générale et spécialisée\n🔬 **Examens de laboratoire** — analyses biologiques complètes\n📋 **Ordonnances** — prescriptions médicales en ligne\n💊 **Suivi des traitements** — consultations de suivi\n🧾 **Facturation** — gestion de vos remboursements\n\nVous souhaitez prendre rendez-vous avec l'un de nos spécialistes ?";

        // Contact
        if (t.contains("contact") || t.contains("adresse") || t.contains("téléphone") || t.contains("email"))
            return "Pour nous contacter :\n📞 Appelez directement la clinique\n💬 Utilisez ce chat pour toute question\n📅 Prenez rendez-vous en ligne via votre espace patient\n\nNos équipes sont disponibles du lundi au vendredi de 08h à 18h.";

        // Patients — ne pas exposer les stats brutes au public
        if (t.contains("patient") && "ADMIN".equalsIgnoreCase(role)) {
            long nb = patientRepository.count();
            return "La clinique compte actuellement " + nb + " patient" + (nb > 1 ? "s" : "") + " enregistré" + (nb > 1 ? "s" : "") + ".";
        }

        return aide(role);
    }

    private String aide(String role) {
        if ("MEDECIN".equals(role))
            return "Je peux vous aider sur : vos rendez-vous, vos patients, les informations médicales générales, la rédaction de notes. Posez votre question !";
        if ("ADMIN".equals(role))
            return "Je peux vous aider sur : les statistiques, la gestion des médecins, des patients, des rendez-vous. Posez votre question !";
        return "Je suis MediAssist, votre assistant santé. Je peux vous aider à :\n\n"
            + "📅 **Prendre un rendez-vous** — dites-moi \"comment prendre un rendez-vous\"\n"
            + "👨‍⚕️ **Trouver un médecin** — demandez \"quels sont vos médecins\"\n"
            + "🕐 **Connaître nos horaires** — demandez \"quels sont vos horaires\"\n"
            + "🏥 **Découvrir nos services** — demandez \"quels services proposez-vous\"\n\n"
            + "Comment puis-je vous aider ?";
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

    // ── HISTORIQUE CHATBOT ────────────────────────────────────────────────

    private void sauvegarderMessage(Utilisateur utilisateur, String sessionId,
                                     String role, String contenu, String source) {
        try {
            ChatMessage msg = ChatMessage.builder()
                .utilisateur(utilisateur)
                .sessionId(sessionId)
                .role(role)
                .contenu(contenu)
                .source(source)
                .dateMessage(LocalDateTime.now())
                .build();
            chatMessageRepository.save(msg);
        } catch (Exception ignored) {
            // Ne jamais bloquer le chatbot à cause de l'historique
        }
    }

    /** Sessions d'un utilisateur avec aperçu */
    public List<ChatHistoryDto> getSessionsUtilisateur(Long utilisateurId) {
        List<String> sessions = chatMessageRepository.findSessionsByUtilisateurId(utilisateurId);
        return sessions.stream().map(sid -> {
            List<ChatMessage> msgs = chatMessageRepository
                .findBySessionIdOrderByDateMessageAsc(sid);
            List<ChatHistoryDto.ChatMessageDto> dtos = msgs.stream()
                .map(m -> ChatHistoryDto.ChatMessageDto.builder()
                    .id(m.getId()).role(m.getRole()).contenu(m.getContenu())
                    .source(m.getSource()).dateMessage(m.getDateMessage())
                    .build())
                .collect(Collectors.toList());
            return ChatHistoryDto.builder()
                .sessionId(sid)
                .dateDebut(msgs.isEmpty() ? null : msgs.get(0).getDateMessage())
                .dateFin(msgs.isEmpty()   ? null : msgs.get(msgs.size()-1).getDateMessage())
                .nbMessages(msgs.size())
                .messages(dtos)
                .build();
        }).collect(Collectors.toList());
    }

    /** Messages d'une session précise */
    public List<ChatHistoryDto.ChatMessageDto> getSession(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByDateMessageAsc(sessionId)
            .stream()
            .map(m -> ChatHistoryDto.ChatMessageDto.builder()
                .id(m.getId()).role(m.getRole()).contenu(m.getContenu())
                .source(m.getSource()).dateMessage(m.getDateMessage())
                .build())
            .collect(Collectors.toList());
    }

    /** Supprimer l'historique d'un utilisateur */
    public void supprimerHistorique(Long utilisateurId) {
        List<ChatMessage> msgs = chatMessageRepository
            .findByUtilisateurIdOrderByDateMessageDesc(utilisateurId);
        chatMessageRepository.deleteAll(msgs);
    }
}
