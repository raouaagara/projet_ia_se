# Fichier: test_booking.py
# Suite de tests unitaires pour booking_engine.py
# Objectif : couvrir 100% des chemins du code

import pytest
from booking_engine import calculer_prix_chambre


# =============================================================================
# CAS NOMINAUX - Chemins heureux
# =============================================================================

class TestCasNominal:
    """Tests des cas simples et attendus."""

    def test_standard_basse_saison_sans_vue_mer(self):
        """
        Cas nominal de base :
        100€/nuit * 3 nuits = 300€
        """
        prix = calculer_prix_chambre("standard", "basse", False, 3)
        assert prix == 300.0

    def test_standard_basse_saison_avec_vue_mer(self):
        """
        Chambre standard + vue mer :
        (100 + 20) * 3 = 360€
        """
        prix = calculer_prix_chambre("standard", "basse", True, 3)
        assert prix == 360.0

    def test_suite_basse_saison_sans_vue_mer(self):
        """
        Suite sans supplément :
        250€/nuit * 2 nuits = 500€
        """
        prix = calculer_prix_chambre("suite", "basse", False, 2)
        assert prix == 500.0

    def test_suite_basse_saison_avec_vue_mer(self):
        """
        Suite + vue mer :
        (250 + 20) * 2 = 540€
        """
        prix = calculer_prix_chambre("suite", "basse", True, 2)
        assert prix == 540.0


# =============================================================================
# CAS SAISON HAUTE
# =============================================================================

class TestSaisonHaute:
    """Tests avec le multiplicateur haute saison (+50%)."""

    def test_standard_haute_saison_sans_vue_mer(self):
        """
        100€/nuit * 5 nuits * 1.5 = 750€
        """
        prix = calculer_prix_chambre("standard", "haute", False, 5)
        assert prix == 750.0

    def test_standard_haute_saison_avec_vue_mer(self):
        """
        (100 + 20) * 5 * 1.5 = 900€
        """
        prix = calculer_prix_chambre("standard", "haute", True, 5)
        assert prix == 900.0

    def test_suite_haute_saison_sans_vue_mer(self):
        """
        250€/nuit * 4 nuits * 1.5 = 1500€
        """
        prix = calculer_prix_chambre("suite", "haute", False, 4)
        assert prix == 1500.0

    def test_suite_haute_saison_avec_vue_mer(self):
        """
        (250 + 20) * 4 * 1.5 = 1620€
        """
        prix = calculer_prix_chambre("suite", "haute", True, 4)
        assert prix == 1620.0


# =============================================================================
# CAS COMPLEXE - Cumul de toutes les règles
# =============================================================================

class TestCasComplexe:
    """Tests cumulant plusieurs règles simultanément."""

    def test_suite_haute_saison_vue_mer_long_sejour(self):
        """
        Cas complexe : suite + haute saison + vue mer + 10 nuits (réduction)
        (250 + 20) * 10 = 2700€
        2700€ * 1.5 (haute saison) = 4050€
        4050€ * 0.9 (réduction > 7 nuits) = 3645€
        """
        prix = calculer_prix_chambre("suite", "haute", True, 10)
        assert prix == 3645.0

    def test_standard_haute_saison_vue_mer_long_sejour(self):
        """
        (100 + 20) * 8 = 960€
        960€ * 1.5 = 1440€
        1440€ * 0.9 = 1296€
        """
        prix = calculer_prix_chambre("standard", "haute", True, 8)
        assert prix == 1296.0

    def test_suite_basse_saison_vue_mer_long_sejour(self):
        """
        Basse saison + vue mer + long séjour (8 nuits) :
        (250 + 20) * 8 = 2160€
        2160€ * 0.9 = 1944€
        """
        prix = calculer_prix_chambre("suite", "basse", True, 8)
        assert prix == 1944.0

    def test_standard_basse_saison_sans_vue_mer_long_sejour(self):
        """
        Standard + basse saison + pas de vue mer + 10 nuits :
        100 * 10 = 1000€
        1000€ * 0.9 = 900€
        """
        prix = calculer_prix_chambre("standard", "basse", False, 10)
        assert prix == 900.0


# =============================================================================
# CAS LIMITE - Frontière exacte de la réduction long séjour
# =============================================================================

class TestCasLimite:
    """Tests aux frontières des règles métier."""

    def test_exactement_7_nuits_pas_de_reduction(self):
        """
        Exactement 7 nuits : PAS de réduction (la condition est > 7, pas >= 7).
        100 * 7 = 700€
        """
        prix = calculer_prix_chambre("standard", "basse", False, 7)
        assert prix == 700.0

    def test_8_nuits_reduction_appliquee(self):
        """
        8 nuits : la réduction s'applique.
        100 * 8 = 800€ * 0.9 = 720€
        """
        prix = calculer_prix_chambre("standard", "basse", False, 8)
        assert prix == 720.0

    def test_exactement_1_nuit(self):
        """
        Durée minimale valide : 1 nuit.
        100 * 1 = 100€
        """
        prix = calculer_prix_chambre("standard", "basse", False, 1)
        assert prix == 100.0


# =============================================================================
# CAS D'ERREUR - Valeurs invalides
# =============================================================================

class TestCasErreur:
    """Tests des cas qui doivent lever des exceptions."""

    def test_duree_sejour_nulle(self):
        """
        Une durée de 0 nuit doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="La durée du séjour doit être positive."):
            calculer_prix_chambre("standard", "basse", False, 0)

    def test_duree_sejour_negative(self):
        """
        Une durée négative doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="La durée du séjour doit être positive."):
            calculer_prix_chambre("standard", "basse", False, -5)

    def test_type_chambre_inconnu(self):
        """
        Un type de chambre non reconnu doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="Type de chambre inconnu."):
            calculer_prix_chambre("deluxe", "basse", False, 3)

    def test_type_chambre_vide(self):
        """
        Un type de chambre vide doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="Type de chambre inconnu."):
            calculer_prix_chambre("", "basse", False, 3)

    def test_saison_inconnue(self):
        """
        Une saison non reconnue doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="Saison inconnue."):
            calculer_prix_chambre("standard", "printemps", False, 3)

    def test_saison_vide(self):
        """
        Une saison vide doit lever une ValueError.
        """
        with pytest.raises(ValueError, match="Saison inconnue."):
            calculer_prix_chambre("standard", "", False, 3)
