package com.clinique.gestion.service;

import com.clinique.gestion.entity.FonctionIA;
import com.clinique.gestion.entity.JournalIA;
import com.clinique.gestion.entity.Utilisateur;
import com.clinique.gestion.repository.JournalIARepository;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Journalise chaque appel aux fonctions d'IA (fonction, utilisateur, source, durée, succès). */
@Service
@RequiredArgsConstructor
public class JournalIAService {

    private final JournalIARepository repository;
    private final UtilisateurCourant utilisateurCourant;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tracer(FonctionIA fonction, String source, String modele, long debutNanos, boolean succes, String erreur) {
        Utilisateur u = utilisateurCourant.get().orElse(null);
        repository.save(JournalIA.builder()
                .fonction(fonction)
                .utilisateur(u)
                .role(u != null ? u.getRole().name() : "VISITEUR")
                .source(source)
                .modele(modele)
                .dureeMs((System.nanoTime() - debutNanos) / 1_000_000)
                .succes(succes)
                .erreur(erreur == null ? null : erreur.substring(0, Math.min(255, erreur.length())))
                .build());
    }
}
