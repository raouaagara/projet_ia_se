package com.clinique.gestion.service;

import com.clinique.gestion.dto.NotificationDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.NotificationRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService — Tests unitaires")
class NotificationServiceTest {

    @Mock NotificationRepository       notificationRepository;
    @Mock UtilisateurRepository        utilisateurRepository;
    @Mock NotificationWebSocketService wsService;
    @Mock UtilisateurCourant           utilisateurCourant;

    @InjectMocks NotificationService notificationService;

    private Utilisateur utilisateur;
    private Notification notif;

    @BeforeEach
    void setUp() {
        utilisateur = Utilisateur.builder()
            .id(1L).email("test@test.com").nom("Dupont").prenom("Jean")
            .role(Role.PATIENT).actif(true).build();

        notif = Notification.builder()
            .id(10L).utilisateur(utilisateur)
            .titre("Test").message("Message test")
            .type(TypeNotification.INFORMATION)
            .lue(false).dateCreation(LocalDateTime.now())
            .build();

        // Le destinataire est l'utilisateur connecté (contrôle de propriété de marquerLue / supprimer)
        lenient().when(utilisateurCourant.requis()).thenReturn(utilisateur);
    }

    @Test
    @DisplayName("findByUtilisateur — retourne la liste des notifications")
    void testFindByUtilisateur() {
        when(notificationRepository.findByUtilisateurIdOrderByDateCreationDesc(1L))
            .thenReturn(List.of(notif));

        List<NotificationDto> result = notificationService.findByUtilisateur(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitre()).isEqualTo("Test");
        assertThat(result.get(0).isLue()).isFalse();
    }

    @Test
    @DisplayName("findNonLues — retourne uniquement les notifications non lues")
    void testFindNonLues() {
        when(notificationRepository.findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(1L))
            .thenReturn(List.of(notif));

        List<NotificationDto> result = notificationService.findNonLues(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isLue()).isFalse();
    }

    @Test
    @DisplayName("countNonLues — retourne le bon compteur")
    void testCountNonLues() {
        when(notificationRepository.countByUtilisateurIdAndLueFalse(1L)).thenReturn(3L);

        long count = notificationService.countNonLues(1L);

        assertThat(count).isEqualTo(3L);
    }

    @Test
    @DisplayName("marquerLue — marque la notification comme lue")
    void testMarquerLue() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notif));

        notificationService.marquerLue(10L);

        assertThat(notif.isLue()).isTrue();
        verify(notificationRepository).save(notif);
    }

    @Test
    @DisplayName("marquerLue — notification inexistante ne lève pas d'exception")
    void testMarquerLueInexistante() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());
        // Ne doit pas lever d'exception
        notificationService.marquerLue(999L);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("marquerToutesLues — appelle le repository")
    void testMarquerToutesLues() {
        notificationService.marquerToutesLues(1L);
        verify(notificationRepository).marquerToutesLues(1L);
    }

    @Test
    @DisplayName("supprimer — délègue au repository")
    void testSupprimer() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notif));
        notificationService.supprimer(10L);
        verify(notificationRepository).delete(notif);
    }

    @Test
    @DisplayName("supprimer — refusé pour la notification d'un autre utilisateur")
    void testSupprimerNotificationDAutrui() {
        Utilisateur autre = Utilisateur.builder().id(2L).role(Role.PATIENT).build();
        when(utilisateurCourant.requis()).thenReturn(autre);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notif));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> notificationService.supprimer(10L))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("envoyerRappelRdv — crée une notification et envoie via WebSocket")
    void testEnvoyerRappelRdv() {
        when(notificationRepository.save(any())).thenReturn(notif);
        when(notificationRepository.countByUtilisateurIdAndLueFalse(anyLong())).thenReturn(1L);

        notificationService.envoyerRappelRdv(utilisateur, "Dr Martin", "15/01/2026", 42L);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(TypeNotification.RAPPEL_RDV);
        assertThat(saved.getMessage()).contains("Dr Martin");
        assertThat(saved.isLue()).isFalse();
    }

    @Test
    @DisplayName("envoyerNouvellePrescription — type NOUVELLE_PRESCRIPTION")
    void testEnvoyerNouvellePrescription() {
        when(notificationRepository.save(any())).thenReturn(notif);
        when(notificationRepository.countByUtilisateurIdAndLueFalse(anyLong())).thenReturn(1L);

        notificationService.envoyerNouvellePrescription(utilisateur, "Dr Dupont", 5L);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(TypeNotification.NOUVELLE_PRESCRIPTION);
    }

    @Test
    @DisplayName("envoyer — utilisateur null ne crée pas de notification")
    void testEnvoyerAvecUtilisateurNull() {
        notificationService.envoyerRappelRdv(null, "Dr X", "01/01/2026", 1L);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("creer — crée une notification pour un utilisateur existant")
    void testCreer() {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(utilisateur));
        when(notificationRepository.save(any())).thenReturn(notif);

        notificationService.creer(1L, "Titre", "Message", TypeNotification.INFORMATION, null, null);

        verify(notificationRepository).save(any(Notification.class));
    }
}
