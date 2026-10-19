package com.clinique.gestion.service;

import com.clinique.gestion.dto.PatientDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires et tests d'anomalie — PatientService.
 * Isolation totale via Mockito.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PatientService — Tests unitaires + anomalies")
class PatientServiceTest {

    @Mock PatientRepository     repository;
    @Mock UtilisateurRepository utilisateurRepository;
    @Mock UtilisateurCourant    utilisateurCourant;

    @InjectMocks PatientService patientService;

    private Patient  patient;
    private Utilisateur utilisateur;

    @BeforeEach
    void setUp() {
        utilisateur = Utilisateur.builder()
                .id(10L).email("alice@test.com").role(Role.PATIENT).actif(true).build();
        patient = Patient.builder()
                .id(1L).numeroDossier("PAT-0001")
                .nom("Dupont").prenom("Alice")
                .dateNaissance(LocalDate.of(1990, 5, 15))
                .sexe("F").telephone("0612345678")
                .allergies("Pénicilline").antecedents("Asthme")
                .utilisateur(utilisateur)
                .build();
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Lecture
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Lecture")
    class Lecture {

        @Test
        @DisplayName("findAll — retourne tous les patients convertis en DTO")
        void findAll_retourneListe() {
            when(repository.findAll()).thenReturn(List.of(patient));
            List<PatientDto> result = patientService.findAll();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getNom()).isEqualTo("Dupont");
            assertThat(result.get(0).getPrenom()).isEqualTo("Alice");
        }

        @Test
        @DisplayName("findById — retourne le DTO du patient existant")
        void findById_retourneDto() {
            when(repository.findById(1L)).thenReturn(Optional.of(patient));
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);

            PatientDto dto = patientService.findById(1L);

            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getNumeroDossier()).isEqualTo("PAT-0001");
            assertThat(dto.getAllergies()).isEqualTo("Pénicilline");
        }

        @Test
        @DisplayName("findByMedecin — retourne les patients d'un médecin")
        void findByMedecin_filtreParMedecin() {
            when(repository.findPatientsByMedecinId(2L)).thenReturn(List.of(patient));
            List<PatientDto> result = patientService.findByMedecin(2L);
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("findByUtilisateur — retourne le dossier lié à l'utilisateur")
        void findByUtilisateur_retourneDossier() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(false);
            when(repository.findByUtilisateurId(10L)).thenReturn(Optional.of(patient));

            PatientDto dto = patientService.findByUtilisateur(10L);

            assertThat(dto).isNotNull();
            assertThat(dto.getUtilisateurId()).isEqualTo(10L);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Création
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("create — génère un numéro de dossier si absent")
        void create_genereNumero() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(false);
            ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
            when(repository.save(captor.capture())).thenAnswer(inv -> {
                Patient p = inv.getArgument(0); p.setId(2L); return p;
            });

            PatientDto dto = new PatientDto();
            dto.setNom("Martin"); dto.setPrenom("Bob");
            dto.setNumeroDossier(""); // vide → doit être généré

            PatientDto result = patientService.create(dto);

            assertThat(captor.getValue().getNumeroDossier())
                    .startsWith("PAT-")
                    .hasSize(12); // PAT- + 8 chars UUID
        }

        @Test
        @DisplayName("create — conserve le numéro de dossier si fourni")
        void create_conserveNumeroFourni() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(false);
            when(repository.save(any())).thenAnswer(inv -> {
                Patient p = inv.getArgument(0); p.setId(3L); return p;
            });

            PatientDto dto = new PatientDto();
            dto.setNom("Test"); dto.setPrenom("User");
            dto.setNumeroDossier("PAT-CUSTOM");

            PatientDto result = patientService.create(dto);

            assertThat(result.getNumeroDossier()).isEqualTo("PAT-CUSTOM");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS UNITAIRES — Mise à jour
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Mise à jour")
    class MiseAJour {

        @Test
        @DisplayName("update — met à jour les informations du patient")
        void update_metsAJourChamps() {
            when(repository.findById(1L)).thenReturn(Optional.of(patient));
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(false);
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PatientDto dto = new PatientDto();
            dto.setNom("Dupont"); dto.setPrenom("Alice");
            dto.setTelephone("0699887766");
            dto.setAllergies("Aspirine");

            PatientDto result = patientService.update(1L, dto);

            assertThat(result.getTelephone()).isEqualTo("0699887766");
            assertThat(result.getAllergies()).isEqualTo("Aspirine");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TESTS D'ANOMALIE
    // ════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("Anomalies")
    class Anomalies {

        @Test
        @DisplayName("ANOMALIE — findById patient inexistant lève IllegalArgumentException")
        void findById_patientInexistant_leveException() {
            when(repository.findById(999L)).thenReturn(Optional.empty());
            doNothing().when(utilisateurCourant).verifierAccesPatient(999L);

            assertThatThrownBy(() -> patientService.findById(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Patient introuvable");
        }

        @Test
        @DisplayName("ANOMALIE — un patient ne peut pas créer deux dossiers")
        void create_patientDoubleDossier_leveException() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(true);
            when(utilisateurCourant.requis()).thenReturn(utilisateur);
            when(repository.findByUtilisateurId(10L)).thenReturn(Optional.of(patient));

            PatientDto dto = new PatientDto();
            dto.setNom("Dupont"); dto.setPrenom("Alice");

            assertThatThrownBy(() -> patientService.create(dto))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("existe déjà");
        }

        @Test
        @DisplayName("ANOMALIE — un patient ne peut pas accéder au dossier d'un autre utilisateur")
        void findByUtilisateur_autrePatient_leveAccessDenied() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(true);
            when(utilisateurCourant.requis()).thenReturn(utilisateur); // id=10
            // Tente d'accéder au dossier de l'utilisateur 99 ≠ 10
            assertThatThrownBy(() -> patientService.findByUtilisateur(99L))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("autre utilisateur");
        }

        @Test
        @DisplayName("ANOMALIE — un patient ne peut pas modifier l'utilisateur rattaché")
        void update_patientNePeutModifierRattachement() {
            when(repository.findById(1L)).thenReturn(Optional.of(patient));
            doNothing().when(utilisateurCourant).verifierAccesPatient(1L);
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(true);
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PatientDto dto = new PatientDto();
            dto.setNom("Dupont"); dto.setPrenom("Alice");
            dto.setUtilisateurId(99L); // tente de changer le rattachement

            PatientDto result = patientService.update(1L, dto);

            // Le rattachement ne doit pas avoir changé
            assertThat(result.getUtilisateurId()).isEqualTo(10L);
            verify(utilisateurRepository, never()).findById(99L);
        }

        @Test
        @DisplayName("ANOMALIE — delete délègue au repository")
        void delete_appelleSuppression() {
            patientService.delete(1L);
            verify(repository).deleteById(1L);
        }

        @Test
        @DisplayName("ANOMALIE — findByUtilisateur sans compte → retourne null")
        void findByUtilisateur_sansCompte_retourneNull() {
            when(utilisateurCourant.aLeRole(Role.PATIENT)).thenReturn(false);
            when(repository.findByUtilisateurId(10L)).thenReturn(Optional.empty());

            PatientDto result = patientService.findByUtilisateur(10L);

            assertThat(result).isNull();
        }
    }
}
