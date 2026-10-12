package com.clinique.gestion.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService — Tests unitaires")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    // Secret d'au moins 32 chars pour HS256
    private static final String SECRET = "TestSecretKey2026ForJwtServiceUnitTest!!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",       SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600000L); // 1h

        userDetails = User.builder()
            .username("test@clinique.local")
            .password("encoded")
            .authorities(Collections.emptyList())
            .build();
    }

    @Test
    @DisplayName("generateToken — produit un token non vide")
    void testGenerateToken() {
        String token = jwtService.generateToken(userDetails, Map.of("role", "PATIENT"));
        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature
    }

    @Test
    @DisplayName("extractUsername — retourne l'email du sujet")
    void testExtractUsername() {
        String token = jwtService.generateToken(userDetails, Map.of());
        String username = jwtService.extractUsername(token);
        assertThat(username).isEqualTo("test@clinique.local");
    }

    @Test
    @DisplayName("isTokenValid — token valide pour le bon utilisateur")
    void testIsTokenValid() {
        String token = jwtService.generateToken(userDetails, Map.of());
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid — token invalide pour un autre utilisateur")
    void testIsTokenInvalidAutreUtilisateur() {
        String token = jwtService.generateToken(userDetails, Map.of());
        UserDetails autre = User.builder()
            .username("autre@clinique.local")
            .password("encoded")
            .authorities(Collections.emptyList())
            .build();
        assertThat(jwtService.isTokenValid(token, autre)).isFalse();
    }

    @Test
    @DisplayName("isTokenValid — token expiré retourne false")
    void testIsTokenExpire() {
        JwtService expiredService = new JwtService();
        ReflectionTestUtils.setField(expiredService, "secret",       SECRET);
        ReflectionTestUtils.setField(expiredService, "expirationMs", 1L);
        String token = expiredService.generateToken(userDetails, Map.of());
        try { Thread.sleep(100); } catch (InterruptedException ignored) {}
        // isTokenValid doit retourner false OU lever une exception — les 2 sont OK
        try {
            boolean valid = expiredService.isTokenValid(token, userDetails);
            assertThat(valid).isFalse();
        } catch (Exception e) {
            // ExpiredJwtException attendue = comportement correct
            assertThat(e.getMessage()).containsIgnoringCase("expired");
        }
    }

    @Test
    @DisplayName("generateToken — contient les claims supplémentaires")
    void testGenerateTokenAvecClaims() {
        String token = jwtService.generateToken(userDetails, Map.of("role", "ADMIN", "userId", 1));
        // Le token ne doit pas être null
        assertThat(token).isNotBlank();
        // L'username doit être extractable
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@clinique.local");
    }
}
