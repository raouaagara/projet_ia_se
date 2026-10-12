package com.clinique.gestion.service;

import com.clinique.gestion.dto.ChatbotResponse;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
    @Mock ChatMessageRepository       chatMessageRepository;

    @InjectMocks ChatbotService chatbotService;

    @BeforeEach
    void setUp() {
        // Pas de clé API → fallback règles
        ReflectionTestUtils.setField(chatbotService, "aiApiUrl", "");
        ReflectionTestUtils.setField(chatbotService, "aiApiKey", "");
        ReflectionTestUtils.setField(chatbotService, "aiModel",  "");

        // Stuber les counts nécessaires au buildCliniqueContext
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
        when(chatMessageRepository.save(any())).thenReturn(null);
    }

    // ── Fallback règles ──────────────────────────────────────────────────

    @Test
    @DisplayName("Réponse salutation — bonjour")
    void testReponseSalutation() {
        ChatbotResponse r = chatbotService.repondre("bonjour", "clinique", "PATIENT", "Jean");
        assertThat(r.getReponse()).isNotBlank();
        assertThat(r.getReponse().toLowerCase()).contains("mediassist");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse horaires")
    void testReponseHoraires() {
        ChatbotResponse r = chatbotService.repondre("quels sont vos horaires", "clinique", "PATIENT", "");
        assertThat(r.getReponse()).containsIgnoringCase("08h");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse urgence")
    void testReponseUrgence() {
        ChatbotResponse r = chatbotService.repondre("j'ai une urgence", "clinique", "PATIENT", "");
        assertThat(r.getReponse()).contains("15");
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse RDV — visiteur reçoit un guide, pas les stats brutes")
    void testReponseRdvVisiteur() {
        ChatbotResponse r = chatbotService.repondre("comment prendre un rendez-vous", "clinique", "PATIENT", "");
        assertThat(r.getReponse()).doesNotContain("📅 RDV :");
        assertThat(r.getReponse().toLowerCase()).containsAnyOf("rendez-vous", "connectez", "espace");
    }

    @Test
    @DisplayName("Réponse RDV — médecin reçoit ses stats")
    void testReponseRdvMedecin() {
        ChatbotResponse r = chatbotService.repondre("combien de rendez-vous", "clinique", "MEDECIN", "Dr Martin");
        assertThat(r.getReponse()).isNotBlank();
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse stats — accessible uniquement à l'ADMIN")
    void testReponseStatsAdmin() {
        ChatbotResponse r = chatbotService.repondre("donne-moi les statistiques", "clinique", "ADMIN", "Admin");
        assertThat(r.getReponse()).isNotBlank();
        assertThat(r.getSource()).isEqualTo("REGLES");
    }

    @Test
    @DisplayName("Réponse médecins")
    void testReponseMedecins() {
        Medecin m = Medecin.builder().id(1L).nom("Martin").prenom("Jean")
            .specialite("Cardiologie").disponible(true).build();
        when(medecinRepository.findAll()).thenReturn(List.of(m));

        ChatbotResponse r = chatbotService.repondre("quels sont vos médecins", "clinique", "PATIENT", "");
        assertThat(r.getReponse()).containsIgnoringCase("Martin");
    }

    // ── Historique ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Sauvegarde historique — utilisateur null ne bloque pas")
    void testSauvegardeHistoriqueUtilisateurNull() {
        when(utilisateurRepository.findById(anyLong())).thenReturn(Optional.empty());
        ChatbotResponse r = chatbotService.repondre("test", "clinique", "PATIENT", "", 99L, "session-test");
        assertThat(r).isNotNull();
        assertThat(r.getSessionId()).isNotBlank();
    }

    @Test
    @DisplayName("SessionId retourné dans la réponse")
    void testSessionIdRetourne() {
        ChatbotResponse r = chatbotService.repondre("bonjour", "clinique", "PATIENT", "", null, "my-session-123");
        assertThat(r.getSessionId()).isEqualTo("my-session-123");
    }

    @Test
    @DisplayName("SessionId auto-généré si absent")
    void testSessionIdAutoGenere() {
        ChatbotResponse r = chatbotService.repondre("bonjour", "clinique", "PATIENT", "", null, null);
        assertThat(r.getSessionId()).isNotBlank();
    }

    // ── Statistiques ─────────────────────────────────────────────────────

    @Test
    @DisplayName("statistiques() retourne un objet complet")
    void testStatistiques() {
        // Utiliser lenient pour les stubs potentiellement non appelés selon le code
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
