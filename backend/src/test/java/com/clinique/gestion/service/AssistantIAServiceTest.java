package com.clinique.gestion.service;

import com.clinique.gestion.dto.ia.AnalyseIADto;
import com.clinique.gestion.dto.ia.TriageResultatDto;
import com.clinique.gestion.entity.AnalyseIA;
import com.clinique.gestion.entity.ExamenLaboratoire;
import com.clinique.gestion.entity.FonctionIA;
import com.clinique.gestion.entity.Medecin;
import com.clinique.gestion.entity.NiveauUrgence;
import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.StatutExamen;
import com.clinique.gestion.entity.TriageSymptomes;
import com.clinique.gestion.repository.AnalyseIARepository;
import com.clinique.gestion.repository.ConsultationRepository;
import com.clinique.gestion.repository.ExamenLaboratoireRepository;
import com.clinique.gestion.repository.JournalIARepository;
import com.clinique.gestion.repository.LotMedicamentRepository;
import com.clinique.gestion.repository.MedecinRepository;
import com.clinique.gestion.repository.MedicamentRepository;
import com.clinique.gestion.repository.MouvementStockRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.RendezVousRepository;
import com.clinique.gestion.repository.TriageSymptomesRepository;
import com.clinique.gestion.security.UtilisateurCourant;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.client.ResourceAccessException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Module M5 : quand le modèle de langage n'est pas configuré, ne répond pas ou répond hors cadre, chaque fonction
 * bascule sur le moteur de règles local, et chaque tentative est journalisée.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssistantIAServiceTest {

    @Mock ClientIA clientIA;
    @Mock JournalIAService journal;
    @Spy ObjectMapper objectMapper = new ObjectMapper();
    @Mock UtilisateurCourant utilisateurCourant;
    @Mock PatientRepository patientRepository;
    @Mock MedecinRepository medecinRepository;
    @Mock ConsultationRepository consultationRepository;
    @Mock OrdonnanceRepository ordonnanceRepository;
    @Mock ExamenLaboratoireRepository examenRepository;
    @Mock RendezVousRepository rendezVousRepository;
    @Mock TriageSymptomesRepository triageRepository;
    @Mock AnalyseIARepository analyseRepository;
    @Mock JournalIARepository journalRepository;
    @Mock MedicamentRepository medicamentRepository;
    @Mock LotMedicamentRepository lotRepository;
    @Mock MouvementStockRepository mouvementRepository;

    @InjectMocks AssistantIAService service;

    private Patient adulte;
    private final Medecin generaliste = medecin(1L, "Médecine générale");
    private final Medecin cardiologue = medecin(2L, "Cardiologie");
    private final Medecin pediatre = medecin(3L, "Pédiatrie");

    @BeforeEach
    void preparer() {
        adulte = patient(34);
        when(utilisateurCourant.patientConnecte()).thenReturn(Optional.of(adulte));
        when(medecinRepository.findAll()).thenReturn(List.of(generaliste, cardiologue, pediatre));
        when(medecinRepository.findBySpecialiteContainingIgnoreCase(anyString())).thenAnswer(inv -> {
            String specialite = inv.getArgument(0);
            return List.of(generaliste, cardiologue, pediatre).stream()
                    .filter(m -> m.getSpecialite().equalsIgnoreCase(specialite)).toList();
        });
        when(triageRepository.save(any(TriageSymptomes.class))).thenAnswer(inv -> inv.getArgument(0));
        when(analyseRepository.save(any(AnalyseIA.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ── Pré-triage ───────────────────────────────────────────────────────────

    @Test
    void sansCleApiLeMoteurDeReglesDetecteUneUrgenceVitale() {
        when(clientIA.estConfigure()).thenReturn(false);

        TriageResultatDto r = service.trier("J'ai une douleur thoracique depuis une heure et du mal à respirer");

        assertThat(r.getNiveauUrgence()).isEqualTo(NiveauUrgence.URGENCE_VITALE);
        assertThat(r.getSource()).isEqualTo("REGLES");
        assertThat(r.getConseils()).contains("190", "198").doesNotContain("112", " 15 ");
        assertThat(r.getMedecins()).as("aucune prise de rendez-vous proposée en cas d'urgence vitale").isNullOrEmpty();
        verify(clientIA, never()).completer(anyString(), anyString(), anyDouble(), anyInt());
        verify(journal).tracer(eq(FonctionIA.TRIAGE), eq("REGLES"), anyString(), anyLong(), eq(true), isNull());
    }

    @Test
    void lesReglesOriententVersLaSpecialiteEtProposentDesMedecins() {
        when(clientIA.estConfigure()).thenReturn(false);

        TriageResultatDto r = service.trier("J'ai des palpitations depuis plusieurs jours");

        assertThat(r.getNiveauUrgence()).isEqualTo(NiveauUrgence.MODERE);
        assertThat(r.getSpecialite()).isEqualTo("Cardiologie");
        assertThat(r.getMedecins()).extracting(TriageResultatDto.MedecinSuggere::getId).containsExactly(2L);
        assertThat(r.getAvertissement()).isEqualTo(AssistantIAService.AVERTISSEMENT);
    }

    @Test
    void unEnfantEstOrienteEnPediatrie() {
        when(clientIA.estConfigure()).thenReturn(false);
        when(utilisateurCourant.patientConnecte()).thenReturn(Optional.of(patient(8)));

        TriageResultatDto r = service.trier("Il tousse depuis trois jours");

        assertThat(r.getSpecialite()).isEqualTo("Pédiatrie");
    }

    @Test
    void siLeModeleNeRepondPasLeMoteurDeReglesPrendLeRelais() {
        when(clientIA.estConfigure()).thenReturn(true);
        when(clientIA.modele()).thenReturn("modele-test");
        when(clientIA.completer(anyString(), anyString(), anyDouble(), anyInt()))
                .thenThrow(new ResourceAccessException("Read timed out"));

        TriageResultatDto r = service.trier("J'ai mal au ventre et des nausées depuis hier");

        assertThat(r.getSource()).isEqualTo("REGLES");
        assertThat(r.getSpecialite()).isEqualTo("Médecine générale");
        verify(journal).tracer(eq(FonctionIA.TRIAGE), eq("GROQ"), eq("modele-test"), anyLong(), eq(false), argThat(e -> e.contains("timed out")));
        verify(journal).tracer(eq(FonctionIA.TRIAGE), eq("REGLES"), anyString(), anyLong(), eq(true), isNull());
    }

    @Test
    void leModeleNeMinimiseJamaisUneUrgenceVitaleDetecteeParLesRegles() {
        when(clientIA.estConfigure()).thenReturn(true);
        when(clientIA.completer(anyString(), anyString(), anyDouble(), anyInt())).thenReturn(
                "{\"specialite\":\"Cardiologie\",\"niveauUrgence\":\"FAIBLE\",\"justification\":\"RAS\",\"conseils\":\"Repos\"}");

        TriageResultatDto r = service.trier("Douleur dans la poitrine et je me suis évanoui ce matin");

        assertThat(r.getNiveauUrgence()).isEqualTo(NiveauUrgence.URGENCE_VITALE);
        assertThat(r.getConseils()).contains("190");
    }

    @Test
    void uneReponseDuModeleHorsCadreDeclencheLeRepli() {
        when(clientIA.estConfigure()).thenReturn(true);
        when(clientIA.completer(anyString(), anyString(), anyDouble(), anyInt())).thenReturn(
                "Voici mon avis : {\"specialite\":\"Astrologie\",\"niveauUrgence\":\"FAIBLE\"}");

        TriageResultatDto r = service.trier("J'ai des plaques rouges qui grattent sur la peau");

        assertThat(r.getSource()).isEqualTo("REGLES");
        assertThat(r.getSpecialite()).isEqualTo("Médecine générale");
    }

    @Test
    void lesDonneesEnvoyeesAuModeleSontPseudonymisees() {
        when(clientIA.estConfigure()).thenReturn(true);
        when(clientIA.completer(anyString(), anyString(), anyDouble(), anyInt())).thenReturn(
                "{\"specialite\":\"Médecine générale\",\"niveauUrgence\":\"FAIBLE\",\"justification\":\"\",\"conseils\":\"\"}");

        service.trier("Je suis fatiguée depuis une semaine");

        verify(clientIA).completer(anyString(), argThat(message -> !message.contains("Dupont") && !message.contains("Lucie")
                && !message.contains("PAT-1001") && message.contains("femme, 34 ans")), anyDouble(), anyInt());
    }

    @Test
    void lePreTriageEstReserveAuxPatients() {
        when(utilisateurCourant.patientConnecte()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.trier("Mal de tête")).isInstanceOf(AccessDeniedException.class);
    }

    // ── Résumé de dossier et interprétation ──────────────────────────────────

    @Test
    void leResumeDeDossierEstProduitLocalementSiLeModeleEchoue() {
        when(clientIA.estConfigure()).thenReturn(true);
        when(clientIA.completer(anyString(), anyString(), anyDouble(), anyInt())).thenThrow(new IllegalStateException("Réponse vide du modèle"));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(adulte));
        when(examenRepository.findByPatientIdOrderByDateDemandeDesc(1L)).thenReturn(List.of(
                examen("Glycémie", "Glycémie à jeun : 1,32 g/L élevée"), examen("Bilan lipidique", null)));

        AnalyseIADto a = service.resumerDossier(1L);

        assertThat(a.getSource()).isEqualTo("REGLES");
        assertThat(a.getContenu())
                .contains("CONTEXTE", "POINTS DE VIGILANCE", "Allergie connue : Pénicilline", "Résultat à surveiller : examen « Glycémie »",
                        "1 examen(s) en attente de résultat", "(résultat disponible)")
                .doesNotContain("Dupont", "PAT-1001");
        verify(journal).tracer(eq(FonctionIA.RESUME_DOSSIER), eq("GROQ"), any(), anyLong(), eq(false), anyString());
        verify(journal).tracer(eq(FonctionIA.RESUME_DOSSIER), eq("REGLES"), anyString(), anyLong(), eq(true), isNull());
    }

    @Test
    void lInterpretationLocaleSignaleLesValeursAnormales() {
        when(clientIA.estConfigure()).thenReturn(false);
        ExamenLaboratoire examen = examen("Bilan sanguin", "Glucose : 1,32 g/L élevée\nCréatinine : 9 mg/L\nPotassium : 3,1 mmol/L bas");
        when(examenRepository.findById(10L)).thenReturn(Optional.of(examen));

        AnalyseIADto a = service.interpreterExamen(10L);

        assertThat(a.getSource()).isEqualTo("REGLES");
        assertThat(a.getContenu()).contains("Valeurs signalées comme anormales", "- Glucose : 1,32 g/L élevée",
                "- Potassium : 3,1 mmol/L bas", "L'interprétation finale revient au médecin.");
        assertThat(a.getContenu()).doesNotContain("- Créatinine");
    }

    @Test
    void unExamenSansResultatNePeutPasEtreInterprete() {
        when(examenRepository.findById(11L)).thenReturn(Optional.of(examen("Glycémie", null)));

        assertThatThrownBy(() -> service.interpreterExamen(11L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("pas encore disponible");
    }

    // ── Jeu de données ───────────────────────────────────────────────────────

    private static Patient patient(int age) {
        return Patient.builder().id(1L).numeroDossier("PAT-1001").nom("Dupont").prenom("Lucie").sexe("F")
                .dateNaissance(LocalDate.now().minusYears(age).minusDays(10))
                .antecedents("Asthme léger").allergies("Pénicilline").groupeSanguin("A+").build();
    }

    private static Medecin medecin(Long id, String specialite) {
        return Medecin.builder().id(id).nom("Nom" + id).prenom("Prenom").specialite(specialite).disponible(true).build();
    }

    private ExamenLaboratoire examen(String type, String resultat) {
        return ExamenLaboratoire.builder().id(10L).patient(adulte).typeExamen(type)
                .statut(resultat == null ? StatutExamen.DEMANDE : StatutExamen.RESULTAT_DISPONIBLE)
                .dateDemande(LocalDate.now()).resultatTexte(resultat).build();
    }
}
