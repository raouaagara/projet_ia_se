package com.clinique.gestion.security;

import com.clinique.gestion.entity.Facture;
import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.ExamenLaboratoireRepository;
import com.clinique.gestion.repository.FactureRepository;
import com.clinique.gestion.repository.OrdonnanceRepository;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authentification JWT et contrôle d'accès de bout en bout (filtre JWT, règles d'URL, @PreAuthorize et contrôles de
 * propriété), sur la base H2 alimentée par les données de démonstration.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecuriteIntegrationTest {

    private static final String SECRET_DE_TEST = "secret-de-test-medicare-au-moins-32-caracteres";
    private static final String AUTRE_PATIENT = "patient.test@clinique.local";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired PatientRepository patients;
    @Autowired FactureRepository factures;
    @Autowired OrdonnanceRepository ordonnances;
    @Autowired ExamenLaboratoireRepository examens;
    @Autowired PasswordEncoder passwordEncoder;

    private final Map<String, String> jetons = new HashMap<>();
    private Long dossierLucie;
    private Long dossierAutrePatient;

    @BeforeEach
    void preparer() {
        dossierLucie = dossierDe("patient.dupont@clinique.local");
        // Second patient avec son propre compte, pour les contrôles d'accès croisés.
        Utilisateur autre = utilisateurs.findByEmail(AUTRE_PATIENT).orElseGet(() -> utilisateurs.save(Utilisateur.builder()
                .email(AUTRE_PATIENT).motDePasse(passwordEncoder.encode("password"))
                .nom("Test").prenom("Patient").role(Role.PATIENT).actif(true).build()));
        dossierAutrePatient = patients.findByUtilisateurId(autre.getId()).orElseGet(() -> patients.save(Patient.builder()
                .numeroDossier("PAT-TEST").nom("Test").prenom("Patient").utilisateur(autre).build())).getId();
    }

    // ── Connexion ────────────────────────────────────────────────────────────

    @Test
    void laConnexionRenvoieUnJetonEtLeRole() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"dr.martin@clinique.local\",\"motDePasse\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("MEDECIN"));
    }

    @Test
    void unMauvaisMotDePasseRenvoie401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@clinique.local\",\"motDePasse\":\"mauvais\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unCompteInconnuRenvoie401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"inconnu@clinique.local\",\"motDePasse\":\"password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void lInscriptionCreeToujoursUnComptePatient() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nouveau.patient@clinique.local\",\"motDePasse\":\"secret123\","
                               + "\"nom\":\"Ben Salah\",\"prenom\":\"Amine\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PATIENT"));
    }

    // ── 401 : jeton absent, falsifié ou expiré ───────────────────────────────

    @Test
    void sansJetonLesDonneesSontInaccessibles() throws Exception {
        mvc.perform(get("/api/patients")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/pharmacie/stock")).andExpect(status().isUnauthorized());
    }

    @Test
    void unJetonMalFormeRenvoie401() throws Exception {
        mvc.perform(get("/api/patients").header(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unJetonExpireRenvoie401() throws Exception {
        String expire = JwtServiceTest.jwtService(SECRET_DE_TEST, -1_000)
                .generateToken(User.withUsername("admin@clinique.local").password("x").roles("ADMIN").build(), Map.of());
        mvc.perform(get("/api/patients").header(HttpHeaders.AUTHORIZATION, "Bearer " + expire))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unJetonSigneAvecUnAutreSecretRenvoie401() throws Exception {
        String forge = JwtServiceTest.jwtService("un-secret-inconnu-du-serveur-de-32-caracteres", 60_000)
                .generateToken(User.withUsername("admin@clinique.local").password("x").roles("ADMIN").build(), Map.of());
        mvc.perform(get("/api/utilisateurs").header(HttpHeaders.AUTHORIZATION, "Bearer " + forge))
                .andExpect(status().isUnauthorized());
    }

    // ── 403 / 200 selon le rôle ──────────────────────────────────────────────

    // Le corps (5e colonne) est valide : la validation @Valid s'exécute avant le contrôle @PreAuthorize.
    @ParameterizedTest(name = "{0} {1} {2} -> {3}")
    @CsvSource({
            // M1 — utilisateurs : administrateur uniquement
            "patient.dupont, GET, /api/utilisateurs, 403,",
            "medecin,        GET, /api/utilisateurs, 403,",
            "admin,          GET, /api/utilisateurs, 200,",
            // M2 / M3 — données médicales : personnel soignant et administratif
            "labo,           GET, /api/patients, 403,",
            "pharmacien,     GET, /api/patients, 403,",
            "secretaire,     GET, /api/patients, 200,",
            "pharmacien,     GET, /api/rendez-vous/medecin/1, 403,",
            "patient.dupont, GET, /api/consultations/medecin/1, 403,",
            "medecin,        GET, /api/consultations/medecin/1, 200,",
            // M4 — facturation et statistiques
            "labo,           GET, /api/factures, 403,",
            "patient.dupont, GET, /api/factures, 403,",
            "secretaire,     GET, /api/factures, 200,",
            "patient.dupont, GET, /api/statistiques-detail, 403,",
            // M5 — IA
            "medecin,        GET, /api/ia/previsions, 403,",
            "secretaire,     GET, /api/ia/journal, 403,",
            "admin,          GET, /api/ia/statut, 200,",
            "admin,          POST, /api/ia/triage, 403, '{\"symptomes\":\"Mal de tête depuis deux jours\"}'",
            // M6 — pharmacie
            "secretaire,     GET, /api/pharmacie/stock, 403,",
            "medecin,        GET, /api/pharmacie/stock, 403,",
            "pharmacien,     GET, /api/pharmacie/stock, 200,",
            "medecin,        GET, /api/pharmacie/medicaments, 200,",
            "secretaire,     POST, /api/pharmacie/delivrances, 403, '{\"ordonnanceId\":1}'",
            "patient.dupont, POST, /api/pharmacie/receptions, 403, '{\"medicamentId\":1,\"numeroLot\":\"L1\",\"quantite\":1,\"datePeremption\":\"2030-01-01\"}'"
    })
    void lAccesDependDuRole(String compte, String methode, String url, int attendu, String corps) throws Exception {
        mvc.perform(request(org.springframework.http.HttpMethod.valueOf(methode), url)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton(compte))
                        .contentType(MediaType.APPLICATION_JSON).content(corps == null ? "{}" : corps))
                .andExpect(status().is(attendu));
    }

    // ── Propriété : un patient ne voit que ses propres données ───────────────

    @Test
    void unPatientNAccedeQuASonPropreDossier() throws Exception {
        String lucie = jeton("patient.dupont");
        for (String url : new String[]{"/api/patients/%d", "/api/rendez-vous/patient/%d", "/api/consultations/patient/%d",
                "/api/factures/patient/%d", "/api/ordonnances/patient/%d", "/api/examens/patient/%d"}) {
            mvc.perform(get(url.formatted(dossierLucie)).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie))
                    .andExpect(status().isOk());
            mvc.perform(get(url.formatted(dossierAutrePatient)).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void unPatientNePeutPasPrendreRendezVousPourUnAutre() throws Exception {
        mvc.perform(post("/api/rendez-vous").header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton("patient.dupont"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patientId\":%d,\"medecinId\":1,\"dateHeure\":\"2030-01-15T10:00:00\",\"motif\":\"Test\"}"
                                .formatted(dossierAutrePatient)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unPatientNePeutPasModifierLeCompteDUnAutre() throws Exception {
        Long adminId = utilisateurs.findByEmail("admin@clinique.local").orElseThrow().getId();
        String lucie = jeton("patient.dupont");
        mvc.perform(get("/api/utilisateurs/" + adminId).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/utilisateurs/" + adminId).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@clinique.local\",\"nom\":\"X\",\"prenom\":\"Y\",\"role\":\"PATIENT\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void laFacturePdfNEstRemiseQuASonPatient() throws Exception {
        Facture facture = factures.findByPatientIdOrderByDateFactureDesc(dossierLucie).get(0);
        MvcResult pdf = mvc.perform(get("/api/factures/" + facture.getId() + "/pdf")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton("patient.dupont")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();
        assertThat(new String(pdf.getResponse().getContentAsByteArray(), 0, 5)).isEqualTo("%PDF-");

        mvc.perform(get("/api/factures/" + facture.getId() + "/pdf").header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton(AUTRE_PATIENT)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/factures/" + facture.getId() + "/pdf").header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton("labo")))
                .andExpect(status().isForbidden());
    }

    @Test
    void lesPdfEtLHistoriqueDuChatSontReservesASonTitulaire() throws Exception {
        String lucie = jeton("patient.dupont");
        String autre = jeton(AUTRE_PATIENT);
        Long ordonnance = ordonnances.findByConsultationPatientIdOrderByDateEmissionDesc(dossierLucie).get(0).getId();
        Long examen = examens.findByPatientIdOrderByDateDemandeDesc(dossierLucie).get(0).getId();
        for (String url : new String[]{"/api/pdf/ordonnance/" + ordonnance, "/api/pdf/examen/" + examen}) {
            mvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie))
                    .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF));
            mvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, "Bearer " + autre)).andExpect(status().isForbidden());
        }

        Long uidLucie = utilisateurs.findByEmail("patient.dupont@clinique.local").orElseThrow().getId();
        mvc.perform(get("/api/chatbot/historique/" + uidLucie).header(HttpHeaders.AUTHORIZATION, "Bearer " + lucie))
                .andExpect(status().isOk());
        mvc.perform(get("/api/chatbot/historique/" + uidLucie).header(HttpHeaders.AUTHORIZATION, "Bearer " + autre))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/chatbot/historique/" + uidLucie).header(HttpHeaders.AUTHORIZATION, "Bearer " + autre))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/chatbot/historique/" + uidLucie)).andExpect(status().isUnauthorized());
    }

    // ── Outils ───────────────────────────────────────────────────────────────

    private Long dossierDe(String email) {
        Long uid = utilisateurs.findByEmail(email).orElseThrow().getId();
        return patients.findByUtilisateurId(uid).orElseThrow().getId();
    }

    /** Jeton obtenu par la vraie connexion ; « medecin » désigne dr.martin, les autres comptes sont @clinique.local. */
    private String jeton(String compte) throws Exception {
        String email = compte.contains("@") ? compte
                : (compte.equals("medecin") ? "dr.martin" : compte) + "@clinique.local";
        if (!jetons.containsKey(email)) {
            MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"motDePasse\":\"password\"}"))
                    .andExpect(status().isOk()).andReturn();
            JsonNode corps = json.readTree(r.getResponse().getContentAsString());
            jetons.put(email, corps.get("token").asText());
        }
        return jetons.get(email);
    }
}
