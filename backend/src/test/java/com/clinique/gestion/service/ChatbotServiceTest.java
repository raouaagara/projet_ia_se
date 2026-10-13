package com.clinique.gestion.service;

import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.entity.ChatMessage;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.StatutPaiement;
import com.clinique.gestion.entity.StatutRendezVous;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ChatbotService — Tests unitaires")
class ChatbotServiceTest {

    @Mock PatientRepository           patientRepository;
    @Mock MedecinRepository           medecinRepository;
    @Mock RendezVousRepository        rendezVousRepository;
    @Mock ConsultationRepository      consultationRepository;
    @Mock UtilisateurRepository       utilisateurRepository;
    @Mock OrdonnanceRepository        ordonnanceRepository;
    @Mock FactureRepository           factureRepository;
    @Mock ExamenLaboratoireRepository examenRepository;
    @Mock ClientIA                    clientIA;
    @Mock JournalIAService            journal;
    @Mock UtilisateurCourant          utilisateurCourant;
    @Mock ChatMessageRepository       chatMessageRepository;

    @InjectMocks ChatbotService chatbotService;

    @BeforeEach
    void setUp() {
        // Pas de clé API → moteur de règles
        when(clientIA.estConfigure()).thenReturn(false);
        // Visiteur non connecté par défaut
        when(utilisateurCourant.get()).thenReturn(Optional.empty());

        when(patientRepository.count()).thenReturn(10L);
        when(medecinRepository.count()).thenReturn(3L);
        when(medecinRepository.countByDisponibleTrue()).thenReturn(2L);
        when(rendezVousRepository.count()).thenReturn(20L);
        when(rendezVousRepository.countByStatut(StatutRendezVous.PLANIFIE)).thenReturn(6L);
        when(rendezVousRepository.countByStatut(StatutRendezVous.CONFIRME)).thenReturn(7L);
        when(rendezVousRepository.countByStatut(StatutRendezVous.ANNULE)).thenReturn(2L);
        when(consultationRepository.count()).thenReturn(15L);
        when(medecinRepository.findAll()).thenReturn(List.of());
        when(rendezVousRepository.findByDateHeureBetween(any(), any())).thenReturn(List.of());
        when(chatMessageRepository.findBySessionIdOrderByDateMessageAsc(anyString())).thenReturn(List.of());
    }

    /** Le rôle est toujours celui de l'utilisateur authentifié (jamais une valeur envoyée par le client). */
    private Utilisateur connecte(Long id, Role role, String prenom) {
        Utilisateur u = Utilisateur.builder().id(id).email(prenom.toLowerCase() + "@clinique.local")
                .nom("Test").prenom(prenom).role(role).actif(true).build();
        when(utilisateurCourant.get()).thenReturn(Optional.of(u));
        when(utilisateurCourant.requis()).thenReturn(u);
        return u;
    }

    // ── Moteur de règles ─────────────────────────────────────────────────

    @Test
    @DisplayName("Réponse salutation — bonjour")
    void testReponseSalutation() {
        ChatbotResponse r = chatbotService.repondre("bonjour", null);
        assertThat(r.getReponse().toLowerCase()).contains("mediassist");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse horaires")
    void testReponseHoraires() {
        ChatbotResponse r = chatbotService.repondre("quels sont vos horaires", null);
        assertThat(r.getReponse()).contains("8 h", "18 h");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse urgence — numéros tunisiens 190 et 198")
    void testReponseUrgence() {
        ChatbotResponse r = chatbotService.repondre("j'ai une urgence", null);
        assertThat(r.getReponse()).contains("190", "198").doesNotContain("15 (SAMU)", "112");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse RDV — visiteur reçoit un guide, pas les chiffres de la clinique")
    void testReponseRdvVisiteur() {
        ChatbotResponse r = chatbotService.repondre("comment prendre un rendez-vous", null);
        assertThat(r.getReponse()).contains("Mes rendez-vous").doesNotContain("planifiés");
    }

    @Test
    @DisplayName("Réponse RDV — médecin reçoit les chiffres")
    void testReponseRdvMedecin() {
        connecte(2L, Role.MEDECIN, "Jean");
        ChatbotResponse r = chatbotService.repondre("combien de rendez-vous", null);
        assertThat(r.getReponse()).contains("6 planifiés", "7 confirmés");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse stats — refusée au visiteur, donnée au personnel")
    void testReponseStats() {
        assertThat(chatbotService.repondre("donne-moi les statistiques", null).getReponse()).doesNotContain("10 patients");
        connecte(1L, Role.ADMIN, "Claire");
        assertThat(chatbotService.repondre("donne-moi les statistiques", null).getReponse()).contains("10 patients");
    }

    @Test
    @DisplayName("Réponse médecins")
    void testReponseMedecins() {
        Medecin m = Medecin.builder().id(1L).nom("Martin").prenom("Jean")
            .specialite("Cardiologie").disponible(true).build();
        when(medecinRepository.findAll()).thenReturn(List.of(m));

        ChatbotResponse r = chatbotService.repondre("quels sont vos médecins", null);
        assertThat(r.getReponse()).containsIgnoringCase("Martin");
    }

    // ── Historique ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Utilisateur connecté — question et réponse enregistrées dans sa session")
    void testHistoriqueUtilisateurConnecte() {
        connecte(5L, Role.PATIENT, "Lucie");
        ChatbotResponse r = chatbotService.repondre("bonjour", "my-session-123");
        assertThat(r.getSessionId()).isEqualTo("my-session-123");
        verify(chatMessageRepository, times(2)).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("Visiteur — rien n'est enregistré, une session est tout de même renvoyée")
    void testHistoriqueVisiteur() {
        ChatbotResponse r = chatbotService.repondre("bonjour", null);
        assertThat(r.getSessionId()).isNotBlank();
        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    @DisplayName("La session d'un autre utilisateur n'est jamais réutilisée")
    void testSessionDAutrui() {
        Utilisateur autre = Utilisateur.builder().id(9L).role(Role.PATIENT).build();
        when(chatMessageRepository.findBySessionIdOrderByDateMessageAsc("session-autre"))
                .thenReturn(List.of(ChatMessage.builder().utilisateur(autre).sessionId("session-autre").build()));
        connecte(5L, Role.PATIENT, "Lucie");

        ChatbotResponse r = chatbotService.repondre("bonjour", "session-autre");

        assertThat(r.getSessionId()).isNotEqualTo("session-autre").isNotBlank();
    }

    @Test
    @DisplayName("Historique — un patient ne lit ni ne supprime celui d'un autre")
    void testHistoriqueProprietaire() {
        connecte(5L, Role.PATIENT, "Lucie");
        assertThatThrownBy(() -> chatbotService.getSessionsUtilisateur(9L)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> chatbotService.supprimerHistorique(9L)).isInstanceOf(AccessDeniedException.class);
        assertThat(chatbotService.getSessionsUtilisateur(5L)).isEmpty();

        connecte(1L, Role.ADMIN, "Claire");
        assertThat(chatbotService.getSessionsUtilisateur(9L)).isEmpty();
    }

    // ── Statistiques ─────────────────────────────────────────────────────

    @Test
    @DisplayName("statistiques() retourne un objet complet")
    void testStatistiques() {
        lenient().when(factureRepository.count()).thenReturn(5L);
        lenient().when(factureRepository.countByStatut(StatutPaiement.PAYE)).thenReturn(3L);
        lenient().when(factureRepository.countByStatut(StatutPaiement.EN_ATTENTE)).thenReturn(2L);
        lenient().when(factureRepository.sumRevenusTotal()).thenReturn(java.math.BigDecimal.valueOf(1500));
        lenient().when(examenRepository.count()).thenReturn(8L);
        lenient().when(ordonnanceRepository.count()).thenReturn(12L);
        lenient().when(utilisateurRepository.count()).thenReturn(25L);
        lenient().when(rendezVousRepository.countByStatut(StatutRendezVous.TERMINE)).thenReturn(5L);

        var stats = chatbotService.statistiques();
        assertThat(stats.getPatients()).isEqualTo(10L);
        assertThat(stats.getMedecins()).isEqualTo(3L);
        assertThat(stats.getRendezVous()).isEqualTo(20L);
        assertThat(stats.getTauxConfirmation()).isGreaterThanOrEqualTo(0.0);
    }
}
