package com.clinique.gestion.service;

import com.clinique.gestion.dto.RendezVousDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RendezVousService — Tests unitaires")
class RendezVousServiceTest {

    @Mock RendezVousRepository  repository;
    @Mock PatientRepository     patientRepository;
    @Mock MedecinRepository     medecinRepository;
    @Mock NotificationService   notificationService;
    @Mock UtilisateurCourant    utilisateurCourant;

    @InjectMocks RendezVousService rdvService;

    private Patient  patient;
    private Medecin  medecin;
    private RendezVous rdv;

    @BeforeEach
    void setUp() {
        Utilisateur uPatient = Utilisateur.builder().id(10L).build();
        Utilisateur uMedecin = Utilisateur.builder().id(20L).build();

        patient = Patient.builder().id(1L).nom("Dupont").prenom("Alice")
            .numeroDossier("P001").utilisateur(uPatient).build();

        medecin = Medecin.builder().id(2L).nom("Martin").prenom("Jean")
            .specialite("Cardiologie").disponible(true)
            .utilisateur(uMedecin).build();

        rdv = RendezVous.builder()
            .id(100L).patient(patient).medecin(medecin)
            .dateHeure(LocalDateTime.of(2026, 6, 15, 10, 0))
            .motif("Consultation de suivi")
            .statut(StatutRendezVous.PLANIFIE)
            .build();
    }

    // ── findAll ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll — retourne tous les RDV convertis en DTO")
    void testFindAll() {
        when(repository.findAll()).thenReturn(List.of(rdv));
        List<RendezVousDto> result = rdvService.findAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMotif()).isEqualTo("Consultation de suivi");
        assertThat(result.get(0).getPatientNom()).isEqualTo("Alice Dupont");
        assertThat(result.get(0).getMedecinNom()).isEqualTo("Dr Jean Martin");
    }

    @Test
    @DisplayName("findByPatient — filtre par patientId")
    void testFindByPatient() {
        when(repository.findByPatientIdOrderByDateHeureDesc(1L)).thenReturn(List.of(rdv));
        List<RendezVousDto> result = rdvService.findByPatient(1L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPatientId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findByMedecin — filtre par medecinId")
    void testFindByMedecin() {
        when(repository.findByMedecinIdOrderByDateHeureAsc(2L)).thenReturn(List.of(rdv));
        List<RendezVousDto> result = rdvService.findByMedecin(2L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMedecinId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("findById — retourne le bon RDV")
    void testFindById() {
        when(repository.findById(100L)).thenReturn(Optional.of(rdv));
        RendezVousDto dto = rdvService.findById(100L);
        assertThat(dto.getId()).isEqualTo(100L);
        assertThat(dto.getStatut()).isEqualTo(StatutRendezVous.PLANIFIE);
    }

    @Test
    @DisplayName("findById — lève exception si inexistant")
    void testFindByIdInexistant() {
        when(repository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> rdvService.findById(999L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("introuvable");
    }

    // ── create ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — sauvegarde et notifie patient + médecin")
    void testCreate() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(2L)).thenReturn(Optional.of(medecin));
        when(repository.save(any())).thenReturn(rdv);

        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(1L); dto.setMedecinId(2L);
        dto.setDateHeure(rdv.getDateHeure());
        dto.setMotif("Consultation");

        RendezVousDto result = rdvService.create(dto);

        assertThat(result.getId()).isEqualTo(100L);
        // Deux notifications : médecin + patient
        verify(notificationService, times(2)).creer(anyLong(), anyString(), anyString(), any(), anyLong(), anyString());
    }

    @Test
    @DisplayName("create — statut PLANIFIE par défaut")
    void testCreateStatutParDefaut() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(2L)).thenReturn(Optional.of(medecin));

        ArgumentCaptor<RendezVous> captor = ArgumentCaptor.forClass(RendezVous.class);
        when(repository.save(captor.capture())).thenReturn(rdv);

        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(1L); dto.setMedecinId(2L);
        dto.setDateHeure(LocalDateTime.now());

        rdvService.create(dto);

        assertThat(captor.getValue().getStatut()).isEqualTo(StatutRendezVous.PLANIFIE);
    }

    // ── update ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("update — changement PLANIFIE → CONFIRME notifie les 2 parties")
    void testUpdateConfirmation() {
        when(repository.findById(100L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(2L)).thenReturn(Optional.of(medecin));

        RendezVous confirme = RendezVous.builder()
            .id(100L).patient(patient).medecin(medecin)
            .dateHeure(rdv.getDateHeure()).statut(StatutRendezVous.CONFIRME).build();
        when(repository.save(any())).thenReturn(confirme);

        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(1L); dto.setMedecinId(2L);
        dto.setDateHeure(rdv.getDateHeure());
        dto.setStatut(StatutRendezVous.CONFIRME);

        rdvService.update(100L, dto);

        verify(notificationService, times(2)).creer(anyLong(), anyString(), anyString(),
            eq(TypeNotification.RDV_CONFIRME), anyLong(), anyString());
    }

    @Test
    @DisplayName("update — changement vers ANNULE notifie les 2 parties")
    void testUpdateAnnulation() {
        when(repository.findById(100L)).thenReturn(Optional.of(rdv));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(medecinRepository.findById(2L)).thenReturn(Optional.of(medecin));

        RendezVous annule = RendezVous.builder()
            .id(100L).patient(patient).medecin(medecin)
            .dateHeure(rdv.getDateHeure()).statut(StatutRendezVous.ANNULE).build();
        when(repository.save(any())).thenReturn(annule);

        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(1L); dto.setMedecinId(2L);
        dto.setDateHeure(rdv.getDateHeure());
        dto.setStatut(StatutRendezVous.ANNULE);

        rdvService.update(100L, dto);

        verify(notificationService, times(2)).creer(anyLong(), anyString(), anyString(),
            eq(TypeNotification.RDV_ANNULE), anyLong(), anyString());
    }

    // ── delete ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete — appelle deleteById")
    void testDelete() {
        rdvService.delete(100L);
        verify(repository).deleteById(100L);
    }

    // ── Propriété ────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — un patient ne réserve pas pour un autre patient")
    void testCreatePourUnAutrePatient() {
        doThrow(new AccessDeniedException("Accès refusé à ce dossier patient"))
            .when(utilisateurCourant).verifierAccesPatient(1L);
        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(1L);
        dto.setMedecinId(2L);
        dto.setDateHeure(LocalDateTime.of(2026, 6, 20, 9, 0));

        assertThatThrownBy(() -> rdvService.create(dto)).isInstanceOf(AccessDeniedException.class);
        verify(repository, never()).save(any());
    }
}
