package com.clinique.gestion.service;

import com.clinique.gestion.dto.ExamenLaboratoireDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires et tests d'anomalie — ExamenLaboratoireService.
 * Couverture : contrôle d'accès par rôle (LABO vs MEDECIN), notification
 * au changement de statut, cas limites sur les données.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ExamenLaboratoireService — Tests unitaires + anomalies")
class ExamenLaboratoireServiceTest {

    @Mock ExamenLaboratoireRepository examenRepository;
    @Mock PatientRepository           patientRepository;
    @Mock MedecinRepository           medecinRepository;
    @Mock ConsultationRepository      consultationRepository;
    @Mock NotificationService         notificationService;
    @Mock UtilisateurCourant          utilisateurCourant;

    @InjectMocks ExamenLaboratoireService examenService;

    private Patient  patient;
    private Medecin  medecin;
    private ExamenLaboratoire examen;

    @BeforeEach
    void setUp() {
        Utilisateur uPatient = Utilisateur.builder().id(10L).email("p@test.com").build();
        Utilisateur uMedecin = Utilisateur.builder().id(20L).email("m@test.com").build();

        patient = Patient.builder().id(1L).nom("Dupont").prenom("Alice")
                .numeroDossier("PAT-001").utilisateur(uPatient).build();
        medecin = Medecin.builder().id(2L).nom("Martin").prenom("Jean")
                .specialite("Cardiologie").disponible(true)
                .utilisateur(uMedecin).build();

        examen = ExamenLaboratoire.builder()
                .id(100L).patient(patient).medecin(medecin)
                .typeExamen("Glycémie").description("À jeun")
                .statut(StatutExamen.DEMANDE)
                .dateDemande(LocalDate.now())
                .build();
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Lecture
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Lecture")
    class Lecture {

        @Test
        @DisplayName("findAll — retourne tous les examens")
        void findAll_retourneListe() {
            when(examenRepository.findAll()).thenReturn(List.of(examen));
            List<ExamenLaboratoireDto> result = examenService.findAll();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTypeExamen()).isEqualTo("Glycémie");
        }

        @Test
        @DisplayName("findByPatient — filtre par patientId")
        void findByPatient_filtreParPatient() {
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);
            when(examenRepository.findByPatientIdOrderByDateDemandeDesc(1L))
                    .thenReturn(List.of(examen));
            List<ExamenLaboratoireDto> result = examenService.findByPatient(1L);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPatientNom()).isEqualTo("Alice Dupont");
        }

        @Test
        @DisplayName("findByMedecin — filtre par medecinId")
        void findByMedecin_filtreParMedecin() {
            when(examenRepository.findByMedecinIdOrderByDateDemandeDesc(2L))
                    .thenReturn(List.of(examen));
            List<ExamenLaboratoireDto> result = examenService.findByMedecin(2L);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getMedecinNom()).isEqualTo("Dr Jean Martin");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Mise à jour par rôle
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Mise à jour par rôle")
    class MiseAJourParRole {

        @Test
        @DisplayName("LABO peut publier le résultat et changer le statut")
        void labo_peutPublierResultat() {
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            dto.setResultatTexte("Glycémie : 1.32 g/L — élevée");
            dto.setDateResultat(LocalDate.now());

            ExamenLaboratoireDto result = examenService.updateWithRole(100L, dto, "LABO");

            assertThat(result.getStatut()).isEqualTo(StatutExamen.RESULTAT_DISPONIBLE);
            assertThat(result.getResultatTexte()).contains("1.32");
        }

        @Test
        @DisplayName("LABO publie résultat → notifie patient ET médecin")
        void labo_publie_notifieDeuxParties() {
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            dto.setResultatTexte("NFS normale");
            dto.setDateResultat(LocalDate.now());

            examenService.updateWithRole(100L, dto, "LABO");

            verify(notificationService).envoyerResultatDisponible(
                    eq(patient.getUtilisateur()), eq("Glycémie"), eq(100L));
            verify(notificationService).envoyerResultatMedecin(
                    eq(medecin.getUtilisateur()), anyString(), eq("Glycémie"), eq(100L));
        }

        @Test
        @DisplayName("MEDECIN ne peut pas changer le statut vers RESULTAT_DISPONIBLE")
        void medecin_nePeutPasPublierResultat() {
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.RESULTAT_DISPONIBLE); // tentative refusée
            dto.setResultatTexte("Résultat injecté par médecin");

            ExamenLaboratoireDto result = examenService.updateWithRole(100L, dto, "MEDECIN");

            // Le statut ne doit pas avoir changé
            assertThat(result.getStatut()).isEqualTo(StatutExamen.DEMANDE);
            // Résultat non modifié
            assertThat(result.getResultatTexte()).isNull();
        }

        @Test
        @DisplayName("MEDECIN peut changer le statut vers EN_COURS (avant publication)")
        void medecin_peutChangerStatutAvantPublication() {
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.EN_COURS);

            ExamenLaboratoireDto result = examenService.updateWithRole(100L, dto, "MEDECIN");

            assertThat(result.getStatut()).isEqualTo(StatutExamen.EN_COURS);
        }

        @Test
        @DisplayName("Résultat déjà publié — MEDECIN ne peut plus rien modifier")
        void medecin_nePeutPasModifierResultatDejaPublie() {
            // Examen déjà publié
            examen.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            examen.setResultatTexte("Valeur originale");
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setResultatTexte("Valeur modifiée"); // tentative refusée
            dto.setStatut(StatutExamen.EN_COURS);    // tentative refusée

            ExamenLaboratoireDto result = examenService.updateWithRole(100L, dto, "MEDECIN");

            assertThat(result.getStatut()).isEqualTo(StatutExamen.RESULTAT_DISPONIBLE);
            assertThat(result.getResultatTexte()).isEqualTo("Valeur originale");
        }

        @Test
        @DisplayName("Résultat déjà publié — pas de double notification")
        void publication_pasDeDoubleNotification() {
            // Examen déjà publié → updateWithRole par LABO
            examen.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            when(examenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            dto.setResultatTexte("Mis à jour");

            examenService.updateWithRole(100L, dto, "LABO");

            // Déjà publié → pas de nouvelle notification
            verify(notificationService, never()).envoyerResultatDisponible(any(), any(), any());
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS D'ANOMALIE
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Anomalies")
    class Anomalies {

        @Test
        @DisplayName("ANOMALIE — findById examen inexistant lève IllegalArgumentException")
        void findById_examenInexistant_leveException() {
            when(examenRepository.findById(999L)).thenReturn(Optional.empty());
            doNothing().when(utilisateurCourant).verifierAccesPatient(anyLong());

            assertThatThrownBy(() -> examenService.findById(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Examen introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — updateWithRole examen inexistant lève IllegalArgumentException")
        void update_examenInexistant_leveException() {
            when(examenRepository.findById(999L)).thenReturn(Optional.empty());

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            assertThatThrownBy(() -> examenService.updateWithRole(999L, dto, "LABO"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Examen introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — create avec patient inexistant lève IllegalArgumentException")
        void create_patientInexistant_leveException() {
            when(patientRepository.findById(999L))
                    .thenThrow(new IllegalArgumentException("Patient introuvable"));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setPatientId(999L);
            dto.setMedecinId(2L);
            dto.setTypeExamen("Test");

            assertThatThrownBy(() -> examenService.create(dto))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Patient introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — delete délègue au repository")
        void delete_appelleSuppression() {
            examenService.delete(100L);
            verify(examenRepository).deleteById(100L);
        }

        @Test
        @DisplayName("ANOMALIE — dateResultat auto-affectée à aujourd'hui si absente lors publication")
        void dateResultat_autoAffectee() {
            when(examenRepository.findById(100L)).thenReturn(Optional.of(examen));
            ArgumentCaptor<ExamenLaboratoire> captor = ArgumentCaptor.forClass(ExamenLaboratoire.class);
            when(examenRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

            ExamenLaboratoireDto dto = new ExamenLaboratoireDto();
            dto.setStatut(StatutExamen.RESULTAT_DISPONIBLE);
            dto.setResultatTexte("Résultat");
            // dateResultat non fournie

            examenService.updateWithRole(100L, dto, "LABO");

            assertThat(captor.getValue().getDateResultat()).isEqualTo(LocalDate.now());
        }
    }
}
