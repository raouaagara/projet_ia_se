package com.clinique.gestion.integration;

import com.clinique.gestion.dto.RendezVousDto;
import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration — endpoint /api/rendez-vous.
 * Utilise une base H2 en mémoire (profil "test") et MockMvc.
 * Chaque test est rollbacké automatiquement.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Intégration — /api/rendez-vous")
class RendezVousIntegrationTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper mapper;

    @Autowired UtilisateurRepository utilisateurRepo;
    @Autowired PatientRepository     patientRepo;
    @Autowired MedecinRepository     medecinRepo;
    @Autowired RendezVousRepository  rdvRepo;
    @Autowired PasswordEncoder       encoder;

    private Long patientId;
    private Long medecinId;

    @BeforeEach
    void setup() {
        // Utilisateur admin pour les tests
        if (utilisateurRepo.findByEmail("admin@test.local").isEmpty()) {
            utilisateurRepo.save(Utilisateur.builder()
                    .email("admin@test.local")
                    .motDePasse(encoder.encode("password"))
                    .nom("Admin").prenom("Test")
                    .role(Role.ADMIN).actif(true).build());
        }

        Patient p = patientRepo.save(Patient.builder()
                .numeroDossier("PAT-INT-001")
                .nom("Integration").prenom("Test")
                .build());
        patientId = p.getId();

        Medecin m = medecinRepo.save(Medecin.builder()
                .matricule("MED-INT-001")
                .nom("Docteur").prenom("Test")
                .specialite("Médecine générale")
                .disponible(true).build());
        medecinId = m.getId();
    }

    // ── GET /api/rendez-vous ───────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/rendez-vous — retourne liste vide au départ")
    void getAll_retourneListeVide() throws Exception {
        mvc.perform(get("/api/rendez-vous"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(0))));
    }

    // ── POST /api/rendez-vous ──────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/rendez-vous — crée un RDV avec statut PLANIFIE")
    void create_creeRdvAvecStatutPlanifie() throws Exception {
        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(patientId);
        dto.setMedecinId(medecinId);
        dto.setDateHeure(LocalDateTime.now().plusDays(1));
        dto.setMotif("Consultation de contrôle");

        mvc.perform(post("/api/rendez-vous")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("PLANIFIE"))
                .andExpect(jsonPath("$.motif").value("Consultation de contrôle"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    // ── PUT /api/rendez-vous/{id} ─────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/rendez-vous/{id} — confirme un RDV existant")
    void update_confirmeRdv() throws Exception {
        // Créer un RDV en base
        RendezVousDto createDto = new RendezVousDto();
        createDto.setPatientId(patientId);
        createDto.setMedecinId(medecinId);
        createDto.setDateHeure(LocalDateTime.now().plusDays(2));
        createDto.setMotif("Test confirmation");

        String responseBody = mvc.perform(post("/api/rendez-vous")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long rdvId = mapper.readTree(responseBody).get("id").asLong();

        // Confirmer le RDV
        RendezVousDto updateDto = new RendezVousDto();
        updateDto.setPatientId(patientId);
        updateDto.setMedecinId(medecinId);
        updateDto.setDateHeure(LocalDateTime.now().plusDays(2));
        updateDto.setStatut(StatutRendezVous.CONFIRME);

        mvc.perform(put("/api/rendez-vous/" + rdvId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("CONFIRME"));
    }

    // ── DELETE /api/rendez-vous/{id} ──────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/rendez-vous/{id} — supprime le RDV")
    void delete_supprimeRdv() throws Exception {
        RendezVousDto createDto = new RendezVousDto();
        createDto.setPatientId(patientId);
        createDto.setMedecinId(medecinId);
        createDto.setDateHeure(LocalDateTime.now().plusDays(3));
        createDto.setMotif("À supprimer");

        String responseBody = mvc.perform(post("/api/rendez-vous")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long rdvId = mapper.readTree(responseBody).get("id").asLong();

        mvc.perform(delete("/api/rendez-vous/" + rdvId))
                .andExpect(status().isOk());

        // Vérifier que le RDV n'existe plus
        mvc.perform(get("/api/rendez-vous/" + rdvId))
                .andExpect(status().is4xxClientError());
    }

    // ── Sécurité ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SÉCURITÉ — GET /api/rendez-vous sans authentification → 401")
    void getAll_sansAuth_retourne401() throws Exception {
        mvc.perform(get("/api/rendez-vous"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SÉCURITÉ — POST /api/rendez-vous sans authentification → 401")
    void create_sansAuth_retourne401() throws Exception {
        RendezVousDto dto = new RendezVousDto();
        dto.setPatientId(patientId);
        dto.setMedecinId(medecinId);
        dto.setDateHeure(LocalDateTime.now().plusDays(1));

        mvc.perform(post("/api/rendez-vous")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }
}
