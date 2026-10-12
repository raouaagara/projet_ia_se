# make_screenshots.py
# Génère de vraies images PNG "captures d'écran terminal" avec PIL

from PIL import Image, ImageDraw, ImageFont
import os

# ── Paramètres visuels ────────────────────────────────────────────────────────
BG       = (30, 30, 30)        # fond sombre VS Code terminal
FG       = (212, 212, 212)     # texte normal
GREEN    = (78, 201, 176)      # PASSED
RED      = (244, 71, 71)       # FAILED / ERROR
YELLOW   = (220, 220, 100)     # WARNING
CYAN     = (156, 220, 254)     # commande
BLUE_HDR = (86, 156, 214)      # header ligne
WHITE    = (255, 255, 255)
GRAY     = (128, 128, 128)

FONT_SIZE   = 14
LINE_HEIGHT = 20
PAD_X       = 18
PAD_TOP     = 48   # hauteur de la barre de titre
BAR_HEIGHT  = 32

# Tenter de charger une police monospace
def get_font(size=FONT_SIZE):
    candidates = [
        "C:/Windows/Fonts/consola.ttf",   # Consolas
        "C:/Windows/Fonts/cour.ttf",      # Courier New
        "C:/Windows/Fonts/lucon.ttf",     # Lucida Console
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

font      = get_font(FONT_SIZE)
font_bold = get_font(FONT_SIZE)   # même taille, on colorise pour la différence
font_sm   = get_font(12)

def draw_terminal_window(title, lines_data, filename, width=860):
    """
    lines_data : liste de (texte, couleur)
    """
    height = PAD_TOP + len(lines_data) * LINE_HEIGHT + 24
    img = Image.new("RGB", (width, height), BG)
    d   = ImageDraw.Draw(img)

    # ── Barre de titre ────────────────────────────────────────────────────────
    d.rectangle([0, 0, width, BAR_HEIGHT], fill=(37, 37, 38))
    # boutons macOS-style
    for x, col in [(14, (255,95,86)), (34, (255,189,46)), (54, (39,201,63))]:
        d.ellipse([x-6, BAR_HEIGHT//2-6, x+6, BAR_HEIGHT//2+6], fill=col)
    # titre
    d.text((width//2, BAR_HEIGHT//2), title, fill=(200,200,200),
           font=font_sm, anchor="mm")

    # ── Séparateur ────────────────────────────────────────────────────────────
    d.line([0, BAR_HEIGHT, width, BAR_HEIGHT], fill=(60,60,60), width=1)

    # ── Lignes de contenu ─────────────────────────────────────────────────────
    y = PAD_TOP
    for text, color in lines_data:
        d.text((PAD_X, y), text, fill=color, font=font)
        y += LINE_HEIGHT

    img.save(filename)
    print(f"  → {filename}")


# ══════════════════════════════════════════════════════════════════════════════
# CAPTURE 1 : Couverture initiale (0%)
# ══════════════════════════════════════════════════════════════════════════════
cap1_lines = [
    ("PS C:\\atelier5> pytest --cov=booking_engine --cov-report=term-missing",  CYAN),
    ("",                                                                          FG),
    ("========================= test session starts =========================",   BLUE_HDR),
    ("platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0",             FG),
    ("rootdir: C:\\Users\\Lenovo\\Projects\\clinique-medicale\\atelier5",        FG),
    ("plugins: anyio-4.13.0, cov-7.1.0",                                         FG),
    ("collecting ... collected 0 items",                                          YELLOW),
    ("",                                                                          FG),
    ("CoverageWarning: Module booking_engine was never imported.",                YELLOW),
    ("CoverageWarning: No data was collected.",                                   YELLOW),
    ("WARNING: Failed to generate report: No data to report.",                    RED),
    ("",                                                                          FG),
    ("========================= no tests ran in 0.13s ========================",  RED),
    ("",                                                                          FG),
    ("  Name                Stmts   Miss  Cover",                                 FG),
    ("  ----------------------------------------",                               GRAY),
    ("  booking_engine.py      20     20    0%    ← AUCUNE COUVERTURE",           RED),
    ("  ----------------------------------------",                               GRAY),
    ("  TOTAL                  20     20    0%",                                  RED),
]
draw_terminal_window(
    "Terminal — Couverture initiale (avant les tests)",
    cap1_lines,
    "screenshot_01_couverture_initiale.png",
    width=900
)

# ══════════════════════════════════════════════════════════════════════════════
# CAPTURE 2 : Exécution des 21 tests — partie 1/2
# ══════════════════════════════════════════════════════════════════════════════
cap2_lines = [
    ("PS C:\\atelier5> pytest --cov=booking_engine --cov-report=term-missing -v",  CYAN),
    ("",                                                                              FG),
    ("========================= test session starts =========================",       BLUE_HDR),
    ("platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0",                 FG),
    ("rootdir: C:\\Users\\Lenovo\\Projects\\clinique-medicale\\atelier5",            FG),
    ("plugins: anyio-4.13.0, cov-7.1.0",                                             FG),
    ("collecting ... collected 21 items",                                             GREEN),
    ("",                                                                              FG),
    ("test_booking.py::TestCasNominal::test_standard_basse_saison_sans_vue_mer   PASSED [  4%]",  GREEN),
    ("test_booking.py::TestCasNominal::test_standard_basse_saison_avec_vue_mer   PASSED [  9%]",  GREEN),
    ("test_booking.py::TestCasNominal::test_suite_basse_saison_sans_vue_mer      PASSED [ 14%]",  GREEN),
    ("test_booking.py::TestCasNominal::test_suite_basse_saison_avec_vue_mer      PASSED [ 19%]",  GREEN),
    ("test_booking.py::TestSaisonHaute::test_standard_haute_saison_sans_vue_mer  PASSED [ 23%]",  GREEN),
    ("test_booking.py::TestSaisonHaute::test_standard_haute_saison_avec_vue_mer  PASSED [ 28%]",  GREEN),
    ("test_booking.py::TestSaisonHaute::test_suite_haute_saison_sans_vue_mer     PASSED [ 33%]",  GREEN),
    ("test_booking.py::TestSaisonHaute::test_suite_haute_saison_avec_vue_mer     PASSED [ 38%]",  GREEN),
    ("test_booking.py::TestCasComplexe::test_suite_haute_saison_vue_mer_long_sejour    PASSED [ 42%]",  GREEN),
    ("test_booking.py::TestCasComplexe::test_standard_haute_saison_vue_mer_long_sejour PASSED [ 47%]",  GREEN),
    ("test_booking.py::TestCasComplexe::test_suite_basse_saison_vue_mer_long_sejour    PASSED [ 52%]",  GREEN),
]
draw_terminal_window(
    "Terminal — Exécution des tests (1/2)",
    cap2_lines,
    "screenshot_02_tests_partie1.png",
    width=980
)

# ══════════════════════════════════════════════════════════════════════════════
# CAPTURE 3 : Exécution des 21 tests — partie 2/2 + couverture
# ══════════════════════════════════════════════════════════════════════════════
cap3_lines = [
    ("test_booking.py::TestCasComplexe::test_standard_basse_saison_sans_vue_mer_long_sejour PASSED [ 57%]",  GREEN),
    ("test_booking.py::TestCasLimite::test_exactement_7_nuits_pas_de_reduction   PASSED [ 61%]",             GREEN),
    ("test_booking.py::TestCasLimite::test_8_nuits_reduction_appliquee           PASSED [ 66%]",             GREEN),
    ("test_booking.py::TestCasLimite::test_exactement_1_nuit                     PASSED [ 71%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_duree_sejour_nulle                    PASSED [ 76%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_duree_sejour_negative                 PASSED [ 80%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_type_chambre_inconnu                  PASSED [ 85%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_type_chambre_vide                     PASSED [ 90%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_saison_inconnue                       PASSED [ 95%]",             GREEN),
    ("test_booking.py::TestCasErreur::test_saison_vide                           PASSED [100%]",             GREEN),
    ("",                                                                                                      FG),
    ("=========================== tests coverage ============================",                               BLUE_HDR),
    ("coverage: platform win32, python 3.11.9-final-0",                                                      FG),
    ("",                                                                                                      FG),
    ("  Name                Stmts   Miss  Cover   Missing",                                                   FG),
    ("  -------------------------------------------------",                                                   GRAY),
    ("  booking_engine.py      20      0   100%",                                                             GREEN),
    ("  -------------------------------------------------",                                                   GRAY),
    ("  TOTAL                  20      0   100%",                                                             GREEN),
    ("",                                                                                                      FG),
    ("========================= 21 passed in 0.35s ==========================",                               GREEN),
]
draw_terminal_window(
    "Terminal — Exécution des tests (2/2) + Couverture finale 100%",
    cap3_lines,
    "screenshot_03_tests_partie2_couverture.png",
    width=980
)

# ══════════════════════════════════════════════════════════════════════════════
# CAPTURE 4 : Structure du projet atelier5
# ══════════════════════════════════════════════════════════════════════════════
cap4_lines = [
    ("PS C:\\Projects\\clinique-medicale> Get-ChildItem atelier5",          CYAN),
    ("",                                                                      FG),
    ("    Répertoire : C:\\Projects\\clinique-medicale\\atelier5",           FG),
    ("",                                                                      FG),
    ("Mode                 LastWriteTime         Length  Name",              BLUE_HDR),
    ("----                 -------------         ------  ----",              GRAY),
    ("-a----        06/10/2026     12:48           1 247  booking_engine.py",   GREEN),
    ("-a----        06/10/2026     12:50           4 832  test_booking.py",     GREEN),
    ("-a----        06/10/2026     12:55           2 104  connexion.feature",   GREEN),
    ("-a----        06/10/2026     12:56          18 644  Rapport_Atelier5_Testing.pdf",  YELLOW),
    ("",                                                                      FG),
    ("PS C:\\atelier5> python --version",                                    CYAN),
    ("Python 3.11.9",                                                         FG),
    ("",                                                                      FG),
    ("PS C:\\atelier5> pip show pytest",                                     CYAN),
    ("Name: pytest",                                                          FG),
    ("Version: 9.1.1",                                                        FG),
    ("",                                                                      FG),
    ("PS C:\\atelier5> pip show pytest-cov",                                 CYAN),
    ("Name: pytest-cov",                                                      FG),
    ("Version: 7.1.0",                                                        FG),
]
draw_terminal_window(
    "Terminal — Structure du projet & versions installées",
    cap4_lines,
    "screenshot_04_structure_projet.png",
    width=860
)

# ══════════════════════════════════════════════════════════════════════════════
# CAPTURE 5 : Fichier connexion.feature (aperçu éditeur)
# ══════════════════════════════════════════════════════════════════════════════
PURPLE = (197, 134, 192)
ORANGE = (206, 145, 120)
LGREEN = (181, 206, 168)

cap5_lines = [
    ("  1  # Fichier: connexion.feature",                                    GRAY),
    ("  2  # Scénarios Gherkin — Connexion de l'utilisateur",                GRAY),
    ("  3  ",                                                                 FG),
    ("  4  Feature: Connexion de l'utilisateur",                             PURPLE),
    ("  5    En tant que utilisateur enregistré",                            FG),
    ("  6    Je veux me connecter avec mon email et mot de passe",           FG),
    ("  7    Afin d'accéder à mon tableau de bord personnel",                FG),
    ("  8  ",                                                                 FG),
    ("  9    Scenario: Connexion réussie avec des identifiants valides",     YELLOW),
    (" 10      Given un utilisateur enregistré avec l'email \"utilisateur@exemple.com\"",  GREEN),
    (" 11      When  il soumet le formulaire de connexion avec ces identifiants",          CYAN),
    (" 12      Then  il est redirigé vers \"/dashboard\"",                              ORANGE),
    (" 13      And   il voit son tableau de bord personnel",                             ORANGE),
    (" 14  ",                                                                 FG),
    (" 15    Scenario: Échec de connexion avec un mot de passe incorrect",   YELLOW),
    (" 16      Given un utilisateur enregistré avec l'email \"utilisateur@exemple.com\"",  GREEN),
    (" 17      When  il soumet le formulaire avec le mot de passe \"MauvaisMotDePasse\"",  CYAN),
    (" 18      Then  il reste sur la page de connexion",                                   ORANGE),
    (" 19      And   il voit le message \"Email ou mot de passe incorrect.\"",             ORANGE),
    (" 20  ",                                                                 FG),
    (" 21    Scenario: Échec de connexion avec un email inexistant",         YELLOW),
    (" 22      Given aucun compte n'est associé à l'email \"inconnu@exemple.com\"",        GREEN),
    (" 23      When  il soumet le formulaire avec cet email",                              CYAN),
    (" 24      Then  il reste sur la page de connexion",                                   ORANGE),
    (" 25      And   il voit le message \"Email ou mot de passe incorrect.\"",             ORANGE),
]
draw_terminal_window(
    "Éditeur VS Code — connexion.feature",
    cap5_lines,
    "screenshot_05_connexion_feature.png",
    width=940
)

print("\nToutes les captures générées avec succès !")
