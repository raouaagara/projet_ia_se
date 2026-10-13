package com.clinique.gestion.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "secret-de-test-medicare-au-moins-32-caracteres";

    private final UserDetails patient = User.withUsername("patient.dupont@clinique.local").password("x").roles("PATIENT").build();
    private final UserDetails admin = User.withUsername("admin@clinique.local").password("x").roles("ADMIN").build();

    static JwtService jwtService(String secret, long expirationMs) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", secret);
        ReflectionTestUtils.setField(service, "expirationMs", expirationMs);
        return service;
    }

    @Test
    void genereUnJetonValidePourSonTitulaire() {
        JwtService jwt = jwtService(SECRET, 60_000);

        String jeton = jwt.generateToken(patient, Map.of("role", "PATIENT", "uid", 5L));

        assertThat(jwt.extractUsername(jeton)).isEqualTo("patient.dupont@clinique.local");
        assertThat(jwt.isTokenValid(jeton, patient)).isTrue();
    }

    @Test
    void unJetonNeVautPasPourUnAutreUtilisateur() {
        JwtService jwt = jwtService(SECRET, 60_000);

        String jeton = jwt.generateToken(patient, Map.of());

        assertThat(jwt.isTokenValid(jeton, admin)).isFalse();
    }

    @Test
    void unJetonExpireEstRefuse() {
        JwtService jwt = jwtService(SECRET, -1_000);

        String jeton = jwt.generateToken(patient, Map.of());

        assertThatThrownBy(() -> jwt.isTokenValid(jeton, patient)).isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void unJetonDontLeContenuAEteModifieEstRefuse() {
        JwtService jwt = jwtService(SECRET, 60_000);
        String[] parties = jwt.generateToken(patient, Map.of("role", "PATIENT")).split("\\.");
        // Le patient tente de se faire passer pour l'administrateur en gardant la signature d'origine.
        String contenuFalsifie = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"admin@clinique.local\",\"role\":\"ADMIN\"}".getBytes(StandardCharsets.UTF_8));
        String jetonFalsifie = parties[0] + "." + contenuFalsifie + "." + parties[2];

        assertThatThrownBy(() -> jwt.extractUsername(jetonFalsifie)).isInstanceOf(JwtException.class);
    }

    @Test
    void unJetonSigneAvecUnAutreSecretEstRefuse() {
        String jeton = jwtService("un-autre-secret-de-plus-de-trente-deux-caracteres", 60_000).generateToken(patient, Map.of());

        assertThatThrownBy(() -> jwtService(SECRET, 60_000).extractUsername(jeton)).isInstanceOf(JwtException.class);
    }
}
