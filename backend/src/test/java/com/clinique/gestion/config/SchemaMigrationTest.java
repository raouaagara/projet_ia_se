package com.clinique.gestion.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SchemaMigrationTest {

    @Test
    void retireLesPictogrammesDesTitres() {
        assertThat(SchemaMigration.corrigerTexte("🎉 Rendez-vous confirmé")).isEqualTo("Rendez-vous confirmé");
        assertThat(SchemaMigration.corrigerTexte("🗓️ Nouveau rendez-vous")).isEqualTo("Nouveau rendez-vous");
        assertThat(SchemaMigration.corrigerTexte("✅ RDV confirmé")).isEqualTo("RDV confirmé");
    }

    @Test
    void convertitLesMontantsEnEurosEnDinars() {
        assertThat(SchemaMigration.corrigerTexte("La facture N° FAC-DEMO01 (75,00 €) a été générée."))
                .isEqualTo("La facture N° FAC-DEMO01 (75,000 DT) a été générée.");
        assertThat(SchemaMigration.corrigerTexte("Total : 1 234,50 €"))
                .isEqualTo("Total : " + Devise.formater(new BigDecimal("1234.50")));
    }

    @Test
    void convertitLesDatesIsoAuFormatFrancais() {
        assertThat(SchemaMigration.corrigerTexte("Rappel : rendez-vous le 2026-09-23 à 10h30."))
                .isEqualTo("Rappel : rendez-vous le 23/09/2026 à 10h30.");
    }

    @Test
    void laisseIntactsLesTextesDejaConformes() {
        String texte = "Une facture de 32,000 DT a été générée (n° FAC-2026-0002) le 13/10/2026.";
        assertThat(SchemaMigration.corrigerTexte(texte)).isEqualTo(texte);
        assertThat(SchemaMigration.corrigerTexte(null)).isNull();
    }
}
