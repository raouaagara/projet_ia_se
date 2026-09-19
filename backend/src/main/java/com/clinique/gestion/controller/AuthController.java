package com.clinique.gestion.controller;

import com.clinique.gestion.dto.AuthResponse;
import com.clinique.gestion.dto.LoginRequest;
import com.clinique.gestion.dto.UtilisateurDto;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Connexion JWT")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    @Operation(summary = "Inscription patient")
    public AuthResponse register(@Valid @RequestBody UtilisateurDto dto) {
        dto.setRole(Role.PATIENT);
        return authService.register(dto);
    }
}
