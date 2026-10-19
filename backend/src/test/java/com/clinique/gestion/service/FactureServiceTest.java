package com.clinique.gestion.service;

import com.clinique.gestion.dto.FactureDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires et tests d'anomalie — FactureService.
 * Isolation totale via Mockito (pas de contexte Spring, pas de BD).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FactureService — Tests unitaires + anomalies")
class FactureServiceTest {

    @Mock FactureRepository     factureRepository;
    @Mock PatientRepository     patientRepository;
    @Mock MedecinRepository     medecinRepository;
    @Mock ConsultationRepository consultationRepository;
    @Mock NotificationService   notificationService;
    @Mock UtilisateurCourant    utilisateurCourant;

    @InjectMocks FactureService factureService;

    private Patient  patient;
    private Medecin  medecin;
    private Facture  facture;

    @BeforeEach
    void setUp() {
        Utilisateur uPatient = Utilisateur.builder().id(10L).email("p@test.com").build();
        patient = Patient.builder().id(1L).nom("Dupont").prenom("Alice")
                .numeroDossier("PAT-001").utilisateur(uPatient).build();
        medecin = Medecin.builder().id(2L).nom("Martin").prenom("Jean")
                .specialite("Cardiologie").disponible(true).build();
        facture = Facture.builder()
                .id(100L).numeroFacture("FAC-2026-0001")
                .patient(patient).medecin(medecin)
                .dateFacture(LocalDate.now())
                .montantTotal(new BigDecimal("150.00"))
                .montantPaye(BigDecimal.ZERO)
                .statut(StatutPaiement.EN_ATTENTE)
                .build();

        when(factureRepository.count()).thenReturn(0L);
        when(factureRepository.findByNumeroFacture(anyString())).thenReturn(Optional.empty());
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Lecture
    // ════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Lecture")
    class Lecture {

        @Test
        @DisplayName("findAll — retourne toutes les factures converties en DTO")
        void findAll_retourneListe() {
            when(factureRepository.findAllOrderByDateCreationDesc()).thenReturn(List.of(facture));
            List<FactureDto> result = factureService.findAll();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getNumeroFacture()).isEqualTo("FAC-2026-0001");
            assertThat(result.get(0).getMontantTotal()).isEqualByComparingTo("150.00");
        }

        @Test
        @DisplayName("findById — retourne le DTO de la facture existante")
        void findById_retourneDto() {
            when(factureRepository.findById(100L)).thenReturn(Optional.of(facture));
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);
            FactureDto dto = factureService.findById(100L);
            assertThat(dto.getId()).isEqualTo(100L);
            assertThat(dto.getStatut()).isEqualTo(StatutPaiement.EN_ATTENTE);
        }

        @Test
        @DisplayName("findByPatient — filtre les factures du patient")
        void findByPatient_filtreParPatient() {
            when(factureRepository.findByPatientIdOrderByDateFactureDesc(1L))
                .thenReturn(List.of(facture));
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);
            List<FactureDto> result = factureService.findByPatient(1L);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPatientNom()).isEqualTo("Alice Dupont");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Création
    // ════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("create — crée une facture avec statut EN_ATTENTE et montant payé à zéro")
        void create_statutEtMontantInitiaux() {
            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            when(factureRepository.save(any())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0);
                f.setId(100L);
                return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);
            dto.setMontantTotal(new BigDecimal("200.00"));

            FactureDto result = factureService.create(dto);

            assertThat(result.getStatut()).isEqualTo(StatutPaiement.EN_ATTENTE);
            assertThat(result.getMontantPaye()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("create — le total est calculé depuis les lignes de facture")
        void create_totalCalculeDepuisLignes() {
            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            when(factureRepository.save(any())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0); f.setId(200L); return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);

            FactureDto.LigneFactureDto l1 = new FactureDto.LigneFactureDto();
            l1.setDescription("Consultation"); l1.setQuantite(1);
            l1.setPrixUnitaire(new BigDecimal("80.00"));

            FactureDto.LigneFactureDto l2 = new FactureDto.LigneFactureDto();
            l2.setDescription("Examen"); l2.setQuantite(2);
            l2.setPrixUnitaire(new BigDecimal("35.00"));

            dto.setLignes(List.of(l1, l2));

            FactureDto result = factureService.create(dto);

            // 80 + 2*35 = 150
            assertThat(result.getMontantTotal()).isEqualByComparingTo("150.00");
        }

        @Test
        @DisplayName("create — notifie le patient si rattaché à un compte utilisateur")
        void create_notifieLePatient() {
            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            when(factureRepository.save(any())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0); f.setId(300L); return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);
            dto.setMontantTotal(new BigDecimal("100.00"));

            factureService.create(dto);

            verify(notificationService).creer(eq(10L), anyString(), anyString(),
                    eq(TypeNotification.FACTURE_GENEREE), anyLong(), eq("FACTURE"));
        }

        @Test
        @DisplayName("create — la date de facture est aujourd'hui si non fournie")
        void create_dateFActureAujourdhui() {
            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            ArgumentCaptor<Facture> captor = ArgumentCaptor.forClass(Facture.class);
            when(factureRepository.save(captor.capture())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0); f.setId(400L); return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);
            dto.setMontantTotal(new BigDecimal("50.00"));
            // dateFacture non fournie

            factureService.create(dto);

            assertThat(captor.getValue().getDateFacture()).isEqualTo(LocalDate.now());
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Mise à jour paiement
    // ════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Mise à jour paiement")
    class MiseAJourPaiement {

        @Test
        @DisplayName("updatePaiement — met à jour le montant payé et le statut")
        void updatePaiement_metsAJourStatut() {
            when(factureRepository.findById(100L)).thenReturn(Optional.of(facture));
            when(factureRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            FactureDto result = factureService.updatePaiement(100L,
                    new BigDecimal("150.00"), StatutPaiement.PAYE);

            assertThat(result.getStatut()).isEqualTo(StatutPaiement.PAYE);
            assertThat(result.getMontantPaye()).isEqualByComparingTo("150.00");
        }

        @Test
        @DisplayName("updatePaiement — paiement partiel → statut PARTIELLEMENT_PAYE")
        void updatePaiement_partiel() {
            when(factureRepository.findById(100L)).thenReturn(Optional.of(facture));
            when(factureRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            FactureDto result = factureService.updatePaiement(100L,
                    new BigDecimal("75.00"), StatutPaiement.PARTIELLEMENT_PAYE);

            assertThat(result.getStatut()).isEqualTo(StatutPaiement.PARTIELLEMENT_PAYE);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS D'ANOMALIE — Cas limites et erreurs
    // ════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Anomalies")
    class Anomalies {

        @Test
        @DisplayName("ANOMALIE — create avec patient inexistant lève IllegalArgumentException")
        void create_patientInexistant_leveException() {
            when(patientRepository.findById(999L)).thenReturn(Optional.empty());

            FactureDto dto = new FactureDto();
            dto.setPatientId(999L);
            dto.setMontantTotal(new BigDecimal("100.00"));

            assertThatThrownBy(() -> factureService.create(dto))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Patient introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — findById avec facture inexistante lève IllegalArgumentException")
        void findById_factureInexistante_leveException() {
            when(factureRepository.findById(999L)).thenReturn(Optional.empty());
            doNothing().when(utilisateurCourant).verifierAccesPatient(anyLong());

            assertThatThrownBy(() -> factureService.findById(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Facture introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — updatePaiement avec facture inexistante lève IllegalArgumentException")
        void updatePaiement_factureInexistante_leveException() {
            when(factureRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> factureService.updatePaiement(999L,
                    new BigDecimal("100.00"), StatutPaiement.PAYE))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Facture introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — create sans montant total ni lignes → montant à zéro")
        void create_sansMontant_montantZero() {
            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            ArgumentCaptor<Facture> captor = ArgumentCaptor.forClass(Facture.class);
            when(factureRepository.save(captor.capture())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0); f.setId(500L); return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);
            // Ni montantTotal, ni lignes

            factureService.create(dto);

            assertThat(captor.getValue().getMontantTotal())
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("ANOMALIE — delete délègue au repository")
        void delete_appelleSuppression() {
            factureService.delete(100L);
            verify(factureRepository).deleteById(100L);
        }

        @Test
        @DisplayName("ANOMALIE — numéro de facture unique : incrémente si collision")
        void genererNumero_incrementeSiCollision() {
            when(factureRepository.count()).thenReturn(0L);
            // Première tentative → collision
            when(factureRepository.findByNumeroFacture(anyString()))
                    .thenReturn(Optional.of(facture))   // 1ère tentative → prise
                    .thenReturn(Optional.empty());       // 2ème tentative → libre

            when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
            when(factureRepository.save(any())).thenAnswer(inv -> {
                Facture f = inv.getArgument(0); f.setId(600L); return f;
            });

            FactureDto dto = new FactureDto();
            dto.setPatientId(1L);
            dto.setMontantTotal(new BigDecimal("50.00"));

            // Ne doit pas lever d'exception
            assertThatCode(() -> factureService.create(dto)).doesNotThrowAnyException();
        }
    }
}
