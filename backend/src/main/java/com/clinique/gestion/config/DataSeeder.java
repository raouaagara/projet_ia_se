package com.clinique.gestion.config;

import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final ConsultationRepository consultationRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final FactureRepository factureRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (utilisateurRepository.count() > 0) {
            return;
        }

        String hash = passwordEncoder.encode("password");

        Utilisateur admin = utilisateurRepository.save(Utilisateur.builder()
                .email("admin@clinique.local").motDePasse(hash).nom("Admin").prenom("Claire")
                .telephone("0102030405").role(Role.ADMIN).actif(true).build());

        Utilisateur uMed = utilisateurRepository.save(Utilisateur.builder()
                .email("dr.martin@clinique.local").motDePasse(hash).nom("Martin").prenom("Jean")
                .telephone("0102030406").role(Role.MEDECIN).actif(true).build());

        Utilisateur uSec = utilisateurRepository.save(Utilisateur.builder()
                .email("secretaire@clinique.local").motDePasse(hash).nom("Bernard").prenom("Sophie")
                .telephone("0102030407").role(Role.SECRETAIRE).actif(true).build());

        Utilisateur uLabo = utilisateurRepository.save(Utilisateur.builder()
                .email("labo@clinique.local").motDePasse(hash).nom("Laboratoire").prenom("Tech")
                .telephone("0102030408").role(Role.LABO).actif(true).build());

        Utilisateur uPat = utilisateurRepository.save(Utilisateur.builder()
                .email("patient.dupont@clinique.local").motDePasse(hash).nom("Dupont").prenom("Lucie")
                .telephone("0611223344").role(Role.PATIENT).actif(true).build());

        Patient patient = patientRepository.save(Patient.builder()
                .numeroDossier("PAT-1001").nom("Dupont").prenom("Lucie")
                .dateNaissance(LocalDate.of(1992, 3, 14)).sexe("F")
                .telephone("0611223344").adresse("12 rue de la Santé, Paris")
                .groupeSanguin("A+").allergies("Pénicilline").antecedents("Asthme léger")
                .utilisateur(uPat).build());

        patientRepository.save(Patient.builder()
                .numeroDossier("PAT-1002").nom("Morel").prenom("Hugo")
                .dateNaissance(LocalDate.of(1985, 11, 2)).sexe("M")
                .telephone("0699887766").adresse("8 avenue Pasteur, Lyon")
                .groupeSanguin("O-").allergies("Aucune").antecedents("Hypertension")
                .build());

        Medecin medecin = medecinRepository.save(Medecin.builder()
                .matricule("MED-2001").nom("Martin").prenom("Jean").specialite("Médecine générale")
                .telephone("0102030406").email("dr.martin@clinique.local")
                .horaires("Lun-Ven 08h-18h").disponible(true).utilisateur(uMed).build());

        medecinRepository.save(Medecin.builder()
                .matricule("MED-2002").nom("Leroy").prenom("Amira").specialite("Cardiologie")
                .telephone("0102030410").email("dr.leroy@clinique.local")
                .horaires("Mar-Jeu 09h-17h").disponible(true).build());

        RendezVous rdv = rendezVousRepository.save(RendezVous.builder()
                .patient(patient).medecin(medecin)
                .dateHeure(LocalDateTime.now().plusDays(2).withHour(10).withMinute(30).withSecond(0).withNano(0))
                .motif("Contrôle annuel").statut(StatutRendezVous.CONFIRME).notes("Patient à jeun").build());

        Consultation consultation = consultationRepository.save(Consultation.builder()
                .patient(patient).medecin(medecin).rendezVous(rdv)
                .dateConsultation(LocalDateTime.now().minusDays(10))
                .diagnostic("Rhume allergique").observations("Examen clinique normal")
                .traitement("Antihistaminique 7 jours").build());

        ordonnanceRepository.save(Ordonnance.builder()
                .consultation(consultation).dateEmission(LocalDate.now().minusDays(10))
                .medicaments("Cétirizine 10 mg").posologie("1 comprimé le soir")
                .instructions("Éviter les allergènes connus").build());

        // ── Facture de démo ────────────────────────────────────────────────
        Facture facture = factureRepository.save(Facture.builder()
                .numeroFacture("FAC-DEMO01")
                .patient(patient)
                .medecin(medecin)
                .consultation(consultation)
                .dateFacture(LocalDate.now().minusDays(10))
                .montantTotal(new BigDecimal("75.00"))
                .montantPaye(new BigDecimal("75.00"))
                .statut(StatutPaiement.PAYE)
                .notes("Consultation remboursée partiellement par la mutuelle")
                .build());

        // ── Examen de démo ─────────────────────────────────────────────────
        examenRepository.save(ExamenLaboratoire.builder()
                .patient(patient)
                .medecin(medecin)
                .consultation(consultation)
                .typeExamen("Numération Formule Sanguine (NFS)")
                .description("Bilan sanguin complet")
                .statut(StatutExamen.RESULTAT_DISPONIBLE)
                .dateDemande(LocalDate.now().minusDays(10))
                .dateResultat(LocalDate.now().minusDays(7))
                .resultatTexte("Globules rouges : 4.8 M/µL (normal)\nGlobules blancs : 7.2 K/µL (normal)\nHémoglobine : 13.5 g/dL (normal)")
                .build());

        examenRepository.save(ExamenLaboratoire.builder()
                .patient(patient)
                .medecin(medecin)
                .typeExamen("Glycémie")
                .description("Contrôle glycémie à jeun")
                .statut(StatutExamen.DEMANDE)
                .dateDemande(LocalDate.now())
                .build());

        // ── Notifications de démo ──────────────────────────────────────────
        notificationRepository.save(Notification.builder()
                .utilisateur(uPat)
                .titre("Rappel de rendez-vous")
                .message("Rappel : vous avez un rendez-vous avec Dr Jean Martin le "
                        + rdv.getDateHeure().toLocalDate() + " à 10h30.")
                .type(TypeNotification.RAPPEL_RDV)
                .lue(false)
                .referenceId(rdv.getId())
                .referenceType("RDV")
                .build());

        notificationRepository.save(Notification.builder()
                .utilisateur(uPat)
                .titre("Résultat d'examen disponible")
                .message("Le résultat de votre examen \"Numération Formule Sanguine\" est disponible.")
                .type(TypeNotification.RESULTAT_DISPONIBLE)
                .lue(false)
                .referenceType("EXAMEN")
                .build());

        notificationRepository.save(Notification.builder()
                .utilisateur(uPat)
                .titre("Nouvelle facture")
                .message("La facture N° FAC-DEMO01 (75,00 €) a été générée pour votre consultation.")
                .type(TypeNotification.FACTURE_GENEREE)
                .lue(true)
                .referenceId(facture.getId())
                .referenceType("FACTURE")
                .build());

        // Notification de démo pour le médecin
        notificationRepository.save(Notification.builder()
                .utilisateur(uMed)
                .titre("🗓️ Nouveau rendez-vous")
                .message("Le patient Lucie Dupont a pris un rendez-vous le "
                        + rdv.getDateHeure().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
                        + " — Motif : Contrôle annuel.")
                .type(TypeNotification.RAPPEL_RDV)
                .lue(false)
                .referenceId(rdv.getId())
                .referenceType("RDV")
                .build());

        notificationRepository.save(Notification.builder()
                .utilisateur(uMed)
                .titre("✅ RDV confirmé")
                .message("Vous avez confirmé le rendez-vous avec Lucie Dupont.")
                .type(TypeNotification.RDV_CONFIRME)
                .lue(false)
                .referenceId(rdv.getId())
                .referenceType("RDV")
                .build());

        // Références pour éviter warnings
        admin.getId();
        uSec.getId();
        uLabo.getId();
    }
}
