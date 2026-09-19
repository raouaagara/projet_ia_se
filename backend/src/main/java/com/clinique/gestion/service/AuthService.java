package com.clinique.gestion.service;

import com.clinique.gestion.dto.AuthResponse;
import com.clinique.gestion.dto.LoginRequest;
import com.clinique.gestion.dto.UtilisateurDto;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.UtilisateurRepository;
import com.clinique.gestion.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
        );
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail()).orElseThrow();
        return buildResponse(user);
    }

    public AuthResponse register(UtilisateurDto dto) {
        if (utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }
        Utilisateur user = Utilisateur.builder()
                .email(dto.getEmail())
                .motDePasse(passwordEncoder.encode(dto.getMotDePasse() == null ? "password" : dto.getMotDePasse()))
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .telephone(dto.getTelephone())
                .role(dto.getRole() == null ? Role.PATIENT : dto.getRole())
                .actif(true)
                .build();
        utilisateurRepository.save(user);
        return buildResponse(user);
    }

    private AuthResponse buildResponse(Utilisateur user) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(details, Map.of("role", user.getRole().name(), "uid", user.getId()));
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .build();
    }
}
