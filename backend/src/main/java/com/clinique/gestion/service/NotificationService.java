package com.clinique.gestion.service;

import com.clinique.gestion.dto.NotificationDto;
import com.clinique.gestion.entity.Notification;
import com.clinique.gestion.entity.TypeNotification;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.NotificationRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public List<NotificationDto> findByUtilisateur(Long uid) {
        return notificationRepository.findByUtilisateurIdOrderByDateCreationDesc(uid)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<NotificationDto> findNonLues(Long uid) {
        return notificationRepository.findByUtilisateurIdAndLueFalseOrderByDateCreationDesc(uid)
            .stream().map(this::toDto).collect(Collectors.toList());
    }

    public long countNonLues(Long uid) {
        return notificationRepository.countByUtilisateurIdAndLueFalse(uid);
    }

    @Transactional
    public void marquerLue(Long id) {
        notificationRepository.findById(id).ifPresent(n -> { n.setLue(true); notificationRepository.save(n); });
    }

    @Transactional
    public void marquerToutesLues(Long uid) {
        notificationRepository.marquerToutesLues(uid);
    }

    @Transactional
    public void supprimer(Long id) {
        notificationRepository.deleteById(id);
    }

    @Transactional
    public void creer(Long utilisateurId, String titre, String message,
                      TypeNotification type, Long referenceId, String referenceType) {
        utilisateurRepository.findById(utilisateurId).ifPresent(u -> {
            Notification n = Notification.builder()
                .utilisateur(u).titre(titre).message(message)
                .type(type).lue(false)
                .referenceId(referenceId).referenceType(referenceType)
                .build();
            notificationRepository.save(n);
        });
    }

    // ── Raccourcis utilisés par les services métier ──────────────────────

    @Transactional
    public void envoyerRappelRdv(Utilisateur patient, String nomMedecin, String dateStr, Long rdvId) {
        envoyer(patient, "Rappel de rendez-vous",
            "Rappel : vous avez rendez-vous avec " + nomMedecin + " le " + dateStr + ".",
            TypeNotification.RAPPEL_RDV, rdvId, "RDV");
    }

    @Transactional
    public void envoyerNouvellePrescription(Utilisateur patient, String nomMedecin, Long ordonnanceId) {
        envoyer(patient, "Nouvelle ordonnance",
            "Le Dr " + nomMedecin + " vous a prescrit une nouvelle ordonnance.",
            TypeNotification.NOUVELLE_PRESCRIPTION, ordonnanceId, "ORDONNANCE");
    }

    @Transactional
    public void envoyerResultatDisponible(Utilisateur patient, String typeExamen, Long examenId) {
        envoyer(patient, "Résultat disponible",
            "Le résultat de votre examen « " + typeExamen + " » est disponible.",
            TypeNotification.RESULTAT_DISPONIBLE, examenId, "EXAMEN");
    }

    @Transactional
    public void envoyerResultatMedecin(Utilisateur medecin, String nomPatient, String typeExamen, Long examenId) {
        envoyer(medecin, "Résultat d'examen reçu",
            "Le résultat de l'examen « " + typeExamen + " » de " + nomPatient + " est disponible.",
            TypeNotification.RESULTAT_EXAMEN, examenId, "EXAMEN");
    }

    private void envoyer(Utilisateur u, String titre, String message,
                         TypeNotification type, Long referenceId, String referenceType) {
        if (u == null) return;
        notificationRepository.save(Notification.builder()
            .utilisateur(u).titre(titre).message(message)
            .type(type).lue(false)
            .referenceId(referenceId).referenceType(referenceType)
            .build());
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setUtilisateurId(n.getUtilisateur().getId());
        dto.setTitre(n.getTitre());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setLue(n.isLue());
        dto.setDateCreation(n.getDateCreation());
        dto.setReferenceId(n.getReferenceId());
        dto.setReferenceType(n.getReferenceType());
        return dto;
    }
}
