package com.clinique.gestion.dto;

import com.clinique.gestion.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private Role role;
}
