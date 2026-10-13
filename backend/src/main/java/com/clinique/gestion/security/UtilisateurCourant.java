package com.clinique.gestion.security;

import com.clinique.gestion.entity.Patient;
import com.clinique.gestion.entity.Role;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.PatientRepository;
import com.clinique.gestion.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Accès à l'utilisateur authentifié et contrôles d'accès aux données d'un patient. */
@Component
@RequiredArgsConstructor
public class UtilisateurCourant {

    private final UtilisateurRepository utilisateurRepository;
    private final PatientRepository patientRepository;

    public Optional<Utilisateur> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return utilisateurRepository.findByEmail(auth.getName());
    }

    public Utilisateur requis() {
        return get().orElseThrow(() -> new AccessDeniedException("Authentification requise"));
    }

    public boolean aLeRole(Role role) {
        return get().map(u -> u.getRole() == role).orElse(false);
    }

    /** Un patient ne peut consulter que ses propres données ; les autres rôles sont filtrés par @PreAuthorize. */
    public void verifierAccesPatient(Long patientId) {
        Optional<Utilisateur> u = get();
        if (u.isEmpty() || u.get().getRole() != Role.PATIENT) {
            return;
        }
        Long sonDossier = patientRepository.findByUtilisateurId(u.get().getId()).map(Patient::getId).orElse(null);
        if (sonDossier == null || !sonDossier.equals(patientId)) {
            throw new AccessDeniedException("Accès refusé à ce dossier patient");
        }
    }

    public Optional<Patient> patientConnecte() {
        return get().filter(u -> u.getRole() == Role.PATIENT)
                .flatMap(u -> patientRepository.findByUtilisateurId(u.getId()));
    }
}
