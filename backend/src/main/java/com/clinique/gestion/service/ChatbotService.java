package com.clinique.gestion.service;

import com.clinique.gestion.dto.ChatHistoryDto;
import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.dto.StatistiqueDto;
import com.clinique.gestion.entity.ChatMessage;
import com.clinique.gestion.entity.FonctionIA;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.entity.StatutPaiement;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Assistant conversationnel MediAssist (module M5). Le rôle et l'identité sont lus dans le jeton de l'utilisateur
 * connecté — jamais dans la requête — afin qu'un visiteur ne puisse pas obtenir les données réservées au personnel.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final String AVERTISSEMENT_URGENCE = "En cas d'urgence vitale, appelez immédiatement le 190 (SAMU) ou le 198 (Protection civile).";

    private final PatientRepository      patientRepository;
    private final MedecinRepository      medecinRepository;
    private final RendezVousRepository   rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final UtilisateurRepository  utilisateurRepository;
    private final OrdonnanceRepository   ordonnanceRepository;
    private final FactureRepository      factureRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final ClientIA clientIA;
    private final JournalIAService journal;
    private final UtilisateurCourant utilisateurCourant;
    private final ChatMessageRepository chatMessageRepository;

    /**
     * Répond au message. Pour un utilisateur connecté, l'échange est enregistré dans sa conversation {@code sessionId}
     * (créée si absente) ; une conversation appartenant à un autre utilisateur n'est jamais réutilisée.
     */
    public ChatbotResponse repondre(String message, String sessionId) {
        Optional<Utilisateur> u = utilisateurCourant.get();
        String role = u.map(x -> x.getRole().name()).orElse("VISITEUR");
        String prenom = u.map(Utilisateur::getPrenom).orElse("");
        Utilisateur auteur = u.orElse(null);

        String sid = sessionId != null && !sessionId.isBlank() && (auteur == null || sessionLibre(sessionId, auteur))
                ? sessionId : UUID.randomUUID().toString();
        if (auteur != null) sauvegarderMessage(auteur, sid, "user", message, null);
        ChatbotResponse reponse = generer(message, role, prenom);
        if (auteur != null) sauvegarderMessage(auteur, sid, "bot", reponse.getReponse(), reponse.getSource());
        reponse.setSessionId(sid);
        return reponse;
    }

    private boolean sessionLibre(String sessionId, Utilisateur auteur) {
        return chatMessageRepository.findBySessionIdOrderByDateMessageAsc(sessionId).stream()
                .allMatch(m -> m.getUtilisateur() != null && m.getUtilisateur().getId().equals(auteur.getId()));
    }

    private ChatbotResponse generer(String message, String role, String prenom) {
        long debut = System.nanoTime();
        if (clientIA.estConfigure()) {
            try {
                String reponse = clientIA.completer(prompt(role, prenom, contexte(role)), message, 0.4, 700);
                journal.tracer(FonctionIA.ASSISTANT, "GROQ", clientIA.modele(), debut, true, null);
                return new ChatbotResponse(reponse, "GROQ");
            } catch (Exception e) {
                log.warn("Assistant IA indisponible, réponse par règles : {}", e.getMessage());
                journal.tracer(FonctionIA.ASSISTANT, "GROQ", clientIA.modele(), debut, false, e.getMessage());
            }
        }
        String reponse = reponseRegles(message, role);
        journal.tracer(FonctionIA.ASSISTANT, "REGLES", "règles locales", debut, true, null);
        return new ChatbotResponse(reponse, "REGLES");
    }

    // ── Consignes système selon le rôle ────────────────────────────────────

    private String prompt(String role, String prenom, String contexte) {
        String communes = """

                RÈGLES :
                - Réponds en français, de façon claire, concise et professionnelle.
                - Tu ne poses jamais de diagnostic définitif et tu ne remplaces pas un avis médical.
                - %s
                - N'invente aucune donnée : utilise uniquement le contexte fourni.

                CONTEXTE DE LA CLINIQUE :
                %s""".formatted(AVERTISSEMENT_URGENCE, contexte);
        String nom = prenom == null || prenom.isBlank() ? "" : " (" + prenom + ")";
        return switch (role) {
            case "ADMIN" -> "Tu es MediAssist, l'assistant d'administration de la clinique MediCare. Tu aides l'administrateur"
                    + nom + " à analyser l'activité, l'organisation, les utilisateurs et les indicateurs." + communes;
            case "MEDECIN" -> "Tu es MediAssist, l'assistant des médecins de la clinique MediCare. Tu t'adresses au Dr" + nom
                    + " avec un vocabulaire médical précis : organisation des consultations, protocoles, rédaction de comptes rendus."
                    + communes;
            case "SECRETAIRE" -> "Tu es MediAssist, l'assistant du secrétariat de la clinique MediCare. Tu aides" + nom
                    + " pour l'accueil, les rendez-vous, le planning et la facturation." + communes;
            case "LABO" -> "Tu es MediAssist, l'assistant du laboratoire de la clinique MediCare. Tu aides" + nom
                    + " pour le traitement des analyses et la publication des résultats." + communes;
            case "PHARMACIEN" -> "Tu es MediAssist, l'assistant de la pharmacie de la clinique MediCare. Tu aides" + nom
                    + " pour la délivrance des ordonnances, la gestion des stocks et les informations générales sur les médicaments."
                    + communes;
            case "PATIENT" -> "Tu es MediAssist, l'assistant santé de la clinique MediCare. Tu t'adresses à un patient" + nom
                    + " : explique comment utiliser son espace (rendez-vous, dossier, résultats, factures), donne des informations"
                    + " de prévention générales et oriente vers le pré-diagnostic IA ou un médecin. Sois rassurant et empathique." + communes;
            default -> "Tu es MediAssist, l'assistant d'accueil de la clinique MediCare. Tu renseignes les visiteurs sur les services,"
                    + " les spécialités, les horaires et la création d'un compte patient. Tu n'as accès à aucune donnée personnelle."
                    + communes;
        };
    }

    /** Contexte transmis au modèle : uniquement ce que le rôle a le droit de connaître. */
    private String contexte(String role) {
        StringBuilder sb = new StringBuilder();
        List<Medecin> medecins = medecinRepository.findAll();
        sb.append("- Équipe médicale : ").append(medecins.stream()
                .map(m -> "Dr " + m.getPrenom() + " " + m.getNom() + " (" + m.getSpecialite() + (m.isDisponible() ? "" : ", indisponible") + ")")
                .collect(Collectors.joining("; "))).append("\n");
        sb.append("- Horaires : du lundi au vendredi de 8 h à 18 h, le samedi de 9 h à 13 h.\n");
        if (role.equals("VISITEUR") || role.equals("PATIENT")) {
            return sb.toString();
        }
        LocalDateTime debutJour = LocalDate.now().atStartOfDay();
        sb.append("- Patients enregistrés : ").append(patientRepository.count()).append("\n");
        sb.append("- Rendez-vous : ").append(rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE)).append(" planifiés, ")
                .append(rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME)).append(" confirmés ; aujourd'hui (")
                .append(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append(") : ")
                .append(rendezVousRepository.findByDateHeureBetween(debutJour, debutJour.plusDays(1)).size()).append("\n");
        sb.append("- Consultations : ").append(consultationRepository.count())
                .append(" ; examens en attente : ").append(examenRepository.countByStatut(StatutExamen.DEMANDE)).append("\n");
        if (role.equals("ADMIN")) {
            java.math.BigDecimal revenus = factureRepository.sumRevenusTotal();
            sb.append("- Factures : ").append(factureRepository.count()).append(" dont ")
                    .append(factureRepository.countByStatut(StatutPaiement.PAYE)).append(" payées ; revenus encaissés : ")
                    .append(com.clinique.gestion.config.Devise.formater(revenus)).append("\n");
            sb.append("- Comptes utilisateurs : ").append(utilisateurRepository.count()).append("\n");
        }
        return sb.toString();
    }

    // ── Réponses sans modèle de langage (moteur de règles) ────────────────

    private String reponseRegles(String message, String role) {
        if (message == null || message.isBlank()) return aide(role);
        String t = message.toLowerCase(Locale.FRENCH).trim();
        boolean personnel = !role.equals("VISITEUR") && !role.equals("PATIENT");

        if (t.matches("(bonjour|salut|hello|bonsoir|hey).*"))
            return "Bonjour ! Je suis MediAssist, l'assistant de la clinique MediCare. Comment puis-je vous aider ?";
        if (t.contains("urgence") || t.contains("urgent"))
            return AVERTISSEMENT_URGENCE;
        if (t.contains("horaire") || t.contains("ouvert"))
            return "La clinique est ouverte du lundi au vendredi de 8 h à 18 h et le samedi de 9 h à 13 h.";
        if (t.contains("service") || t.contains("soin") || t.contains("propose"))
            return "La clinique MediCare propose des consultations de médecine générale et spécialisée, des examens de laboratoire, "
                    + "des ordonnances délivrées par sa pharmacie et le suivi de vos factures en ligne.";
        if (t.contains("contact") || t.contains("adresse") || t.contains("téléphone") || t.contains("telephone"))
            return "Vous pouvez joindre la clinique aux heures d'ouverture (du lundi au vendredi de 8 h à 18 h, le samedi de 9 h à 13 h) "
                    + "ou poser vos questions ici.";
        if (t.contains("médecin") || t.contains("medecin") || t.contains("docteur") || t.contains("spécialit"))
            return listeMedecins();
        if (t.contains("symptôme") || t.contains("symptome") || t.contains("mal ") || t.contains("douleur"))
            return "Pour être orienté vers la bonne spécialité, utilisez le « Pré-diagnostic IA » de votre espace patient. "
                    + "Il ne remplace pas un avis médical. " + AVERTISSEMENT_URGENCE;
        if (t.contains("rdv") || t.contains("rendez")) {
            if (!personnel) {
                return "Pour prendre rendez-vous : **1.** créez votre compte patient ou connectez-vous ; **2.** ouvrez « Mes rendez-vous » "
                        + "puis « Nouveau rendez-vous » ; **3.** choisissez le médecin, la date et l'heure ; **4.** confirmez. "
                        + "Vous recevrez une notification dès que le médecin aura confirmé.";
            }
            return String.format("Rendez-vous : %d planifiés et %d confirmés.",
                    rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE),
                    rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME));
        }
        if (personnel && (t.contains("stat") || t.contains("chiffre") || t.contains("activité"))) {
            return String.format("Activité : %d patients, %d médecins (%d disponibles), %d rendez-vous, %d consultations.",
                    patientRepository.count(), medecinRepository.count(), medecinRepository.countByDisponibleTrue(),
                    rendezVousRepository.count(), consultationRepository.count());
        }

        return aide(role);
    }

    private String aide(String role) {
        return switch (role) {
            case "MEDECIN" -> "Je peux vous renseigner sur vos rendez-vous, l'équipe médicale et l'organisation de la clinique.";
            case "PHARMACIEN" -> "Je peux vous renseigner sur l'organisation de la clinique ; la gestion du stock se fait dans l'espace Pharmacie.";
            case "PATIENT" -> "Je peux vous aider à prendre rendez-vous, retrouver vos résultats ou vos factures, et vous orienter vers le bon spécialiste.";
            case "VISITEUR" -> "Je peux vous présenter nos spécialités, nos horaires et vous expliquer comment créer votre compte patient.";
            default -> "Je peux vous renseigner sur l'activité, les médecins disponibles, les rendez-vous et les horaires.";
        };
    }

    private String listeMedecins() {
        return "Notre équipe : " + medecinRepository.findAll().stream()
                .map(m -> "Dr " + m.getPrenom() + " " + m.getNom() + " (" + m.getSpecialite() + (m.isDisponible() ? "" : ", indisponible") + ")")
                .collect(Collectors.joining(", ")) + ".";
    }

    // ── STATISTIQUES ──────────────────────────────────────────────────────

    public StatistiqueDto statistiques() {
        long totalRdv  = rendezVousRepository.count();
        long planifies = rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE);
        long confirmes = rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME);
        long annules   = rendezVousRepository.countByStatut(StatutRendezVous.ANNULE);
        long termines  = rendezVousRepository.countByStatut(StatutRendezVous.TERMINE);
        double tauxConf = totalRdv > 0 ? Math.round((confirmes + termines) * 100.0 / totalRdv * 10) / 10.0 : 0;
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
        verifierProprietaire(utilisateurId);
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
        Utilisateur moi = utilisateurCourant.requis();
        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByDateMessageAsc(sessionId);
        boolean autrui = messages.stream().anyMatch(m -> m.getUtilisateur() == null || !m.getUtilisateur().getId().equals(moi.getId()));
        if (autrui && moi.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Conversation d'un autre utilisateur");
        }
        return messages.stream()
            .map(m -> ChatHistoryDto.ChatMessageDto.builder()
                .id(m.getId()).role(m.getRole()).contenu(m.getContenu())
                .source(m.getSource()).dateMessage(m.getDateMessage())
                .build())
            .collect(Collectors.toList());
    }

    /** Supprimer l'historique d'un utilisateur */
    public void supprimerHistorique(Long utilisateurId) {
        verifierProprietaire(utilisateurId);
        List<ChatMessage> msgs = chatMessageRepository
            .findByUtilisateurIdOrderByDateMessageDesc(utilisateurId);
        chatMessageRepository.deleteAll(msgs);
    }

    /** Seul l'auteur des conversations (ou un administrateur) peut les consulter ou les supprimer. */
    private void verifierProprietaire(Long utilisateurId) {
        Utilisateur moi = utilisateurCourant.requis();
        if (!moi.getId().equals(utilisateurId) && moi.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Historique d'un autre utilisateur");
        }
    }
}
