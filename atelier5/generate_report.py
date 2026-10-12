# generate_report.py - Génère le rapport PDF de l'Atelier 5

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import date

OUTPUT = "Rapport_Atelier5_Testing.pdf"

# ── Styles ──────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

ESPRIT_BLUE  = colors.HexColor("#003087")
ESPRIT_RED   = colors.HexColor("#CC0000")
GREEN_OK     = colors.HexColor("#1a7a1a")
LIGHT_GRAY   = colors.HexColor("#f4f4f4")
DARK_GRAY    = colors.HexColor("#333333")
PASS_GREEN   = colors.HexColor("#d4edda")
FAIL_RED     = colors.HexColor("#f8d7da")
HEADER_BLUE  = colors.HexColor("#dce8f7")

title_style = ParagraphStyle(
    "Title", parent=styles["Title"],
    textColor=ESPRIT_BLUE, fontSize=20, spaceAfter=6, alignment=TA_CENTER,
    fontName="Helvetica-Bold"
)
subtitle_style = ParagraphStyle(
    "Subtitle", parent=styles["Normal"],
    textColor=ESPRIT_BLUE, fontSize=13, spaceAfter=4, alignment=TA_CENTER,
    fontName="Helvetica-Bold"
)
h1_style = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    textColor=colors.white, fontSize=13, spaceBefore=14, spaceAfter=6,
    fontName="Helvetica-Bold", backColor=ESPRIT_BLUE,
    leftIndent=-10, rightIndent=-10, leading=20,
    borderPad=6
)
h2_style = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    textColor=ESPRIT_BLUE, fontSize=11, spaceBefore=10, spaceAfter=4,
    fontName="Helvetica-Bold", borderPad=4,
)
body_style = ParagraphStyle(
    "Body", parent=styles["Normal"],
    textColor=DARK_GRAY, fontSize=9.5, leading=14, spaceAfter=4,
    fontName="Helvetica"
)
body_bold = ParagraphStyle(
    "BodyBold", parent=body_style, fontName="Helvetica-Bold"
)
code_style = ParagraphStyle(
    "Code", parent=styles["Code"],
    fontSize=7.8, leading=11, fontName="Courier",
    backColor=colors.HexColor("#1e1e1e"), textColor=colors.HexColor("#d4d4d4"),
    leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4,
    borderPad=8
)
note_style = ParagraphStyle(
    "Note", parent=body_style,
    backColor=colors.HexColor("#fff3cd"), textColor=colors.HexColor("#856404"),
    borderPad=6, leftIndent=8, rightIndent=8
)
success_style = ParagraphStyle(
    "Success", parent=body_style,
    backColor=PASS_GREEN, textColor=GREEN_OK,
    borderPad=8, leftIndent=8, rightIndent=8, fontName="Helvetica-Bold",
    fontSize=11, alignment=TA_CENTER
)

# ── Header / Footer ──────────────────────────────────────────────────────────
def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    w, h = A4
    # Header
    canvas_obj.setFillColor(ESPRIT_BLUE)
    canvas_obj.rect(0, h - 1.3*cm, w, 1.3*cm, fill=True, stroke=False)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(1*cm, h - 0.85*cm, "IA for Software Engineering — UP_WEB")
    canvas_obj.drawRightString(w - 1*cm, h - 0.85*cm, "Année Universitaire : 2025-2026")
    # Footer
    canvas_obj.setFillColor(ESPRIT_BLUE)
    canvas_obj.rect(0, 0, w, 0.9*cm, fill=True, stroke=False)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(1*cm, 0.32*cm, f"Atelier 5 : Maîtriser le Testing avec GitHub Copilot")
    canvas_obj.drawRightString(w - 1*cm, 0.32*cm, f"Page {doc.page}")
    canvas_obj.restoreState()

# ── Build document ───────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    topMargin=1.8*cm, bottomMargin=1.6*cm,
    leftMargin=2*cm, rightMargin=2*cm
)

story = []

# ══════════════════════════════════════════════════════════════════════════════
# PAGE DE GARDE
# ══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 1.5*cm))
story.append(Paragraph("ESPRIT — Honoris United Universities", subtitle_style))
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width="100%", thickness=2, color=ESPRIT_RED))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Atelier 5", subtitle_style))
story.append(Paragraph("Maîtriser le Testing avec GitHub Copilot", title_style))
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width="100%", thickness=2, color=ESPRIT_RED))
story.append(Spacer(1, 1*cm))

# Infos
info_data = [
    ["Module :", "IA for Software Engineering"],
    ["Filière :", "UP_WEB"],
    ["Date :", str(date.today().strftime("%d/%m/%Y"))],
    ["Environnement :", "Python 3.11.9 | pytest 9.1.1 | pytest-cov 7.1.0"],
]
info_table = Table(info_data, colWidths=[4*cm, 11*cm])
info_table.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (1,0), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 10),
    ("TEXTCOLOR", (0,0), (0,-1), ESPRIT_BLUE),
    ("TEXTCOLOR", (1,0), (1,-1), DARK_GRAY),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT_GRAY, colors.white]),
    ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
]))
story.append(info_table)
story.append(Spacer(1, 1*cm))

# Objectifs
story.append(Paragraph("Objectifs de l'atelier", h2_style))
objectives = [
    ["✔", "Générer des tests unitaires pertinents pour valider une logique métier complexe."],
    ["✔", "Mesurer l'impact des tests sur la couverture de code (0% → 100%)."],
    ["✔", "Traduire une User Story en scénarios de test comportementaux (Gherkin)."],
    ["✔", "Comparer test unitaire (White Box) et test fonctionnel (Black Box)."],
]
obj_table = Table(objectives, colWidths=[0.6*cm, 14.4*cm])
obj_table.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0,0), (0,-1), GREEN_OK),
    ("FONTNAME", (1,0), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("TEXTCOLOR", (1,0), (1,-1), DARK_GRAY),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 4),
]))
story.append(obj_table)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTIE 1 — TESTS UNITAIRES
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  PARTIE 1 : Tests Unitaires (White Box)", h1_style))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "Objectif : tester la fonction <b>calculer_prix_chambre()</b> du moteur de réservation "
    "hôtelière afin d'atteindre une couverture de code de <b>100%</b>.",
    body_style
))

# ── 1.1 Code source ──────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("1.1  Code source — booking_engine.py", h2_style))
story.append(Paragraph(
    "La fonction implémente les règles métier suivantes :", body_style
))
rules = [
    ["Règle", "Détail"],
    ["Prix de base", "standard = 100 €/nuit  |  suite = 250 €/nuit"],
    ["Saison haute", "Multiplicateur ×1.5 sur le total"],
    ["Vue sur mer", "Supplément +20 €/nuit"],
    ["Long séjour", "Réduction −10% si durée > 7 nuits"],
    ["Erreurs", "ValueError si durée ≤ 0, type inconnu ou saison invalide"],
]
rules_table = Table(rules, colWidths=[4*cm, 11*cm])
rules_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (1,1), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("TEXTCOLOR", (0,1), (0,-1), ESPRIT_BLUE),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("ALIGN", (0,0), (-1,-1), "LEFT"),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(rules_table)

story.append(Spacer(1, 0.3*cm))
booking_code = """\
def calculer_prix_chambre(type_chambre: str, saison: str,
                          a_vue_mer: bool, duree_sejour: int) -> float:
    if duree_sejour <= 0:
        raise ValueError("La durée du séjour doit être positive.")

    prix_base_nuit = 0
    if type_chambre == "standard":
        prix_base_nuit = 100
    elif type_chambre == "suite":
        prix_base_nuit = 250
    else:
        raise ValueError("Type de chambre inconnu.")

    prix_nuit = prix_base_nuit
    if a_vue_mer:
        prix_nuit += 20

    prix_total = prix_nuit * duree_sejour
    if saison == "haute":
        prix_total *= 1.5
    elif saison != "basse":
        raise ValueError("Saison inconnue.")

    if duree_sejour > 7:
        prix_total *= 0.9   # Réduction de 10%

    return round(prix_total, 2)"""
story.append(Preformatted(booking_code, code_style))

# ── 1.2 Couverture initiale ───────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("1.2  Mesure de la couverture initiale (avant tests)", h2_style))
story.append(Paragraph(
    "Commande exécutée avec un fichier <font name='Courier'>test_booking.py</font> vide :", body_style
))
story.append(Preformatted("$ pytest --cov=booking_engine --cov-report=term-missing", code_style))
story.append(Spacer(1, 0.2*cm))

initial_output = """\
========================= test session starts ==========================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
collecting ... collected 0 items

WARNING: Module booking_engine was never imported.
WARNING: No data was collected.
WARNING: Failed to generate report: No data to report.

========================= no tests ran in 0.13s ========================"""
story.append(Preformatted(initial_output, code_style))

cov_initial = [
    ["Fichier", "Stmts", "Miss", "Couverture", "Lignes manquantes"],
    ["booking_engine.py", "20", "20", "0%", "Toutes"],
    ["TOTAL", "20", "20", "0%", "—"],
]
cov_table_i = Table(cov_initial, colWidths=[5*cm, 2*cm, 2*cm, 2.5*cm, 3.5*cm])
cov_table_i.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ("BACKGROUND", (3,1), (3,-1), FAIL_RED),
    ("TEXTCOLOR", (3,1), (3,-1), ESPRIT_RED),
    ("FONTNAME", (3,1), (3,-1), "Helvetica-Bold"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(Spacer(1, 0.15*cm))
story.append(cov_table_i)
story.append(PageBreak())

# ── 1.3 Tests générés ────────────────────────────────────────────────────────
story.append(Paragraph("1.3  Suite de tests générés — test_booking.py", h2_style))
story.append(Paragraph(
    "21 tests répartis en 5 classes, couvrant tous les chemins d'exécution :",
    body_style
))

test_classes = [
    ["Classe", "Nb tests", "Cas couverts"],
    ["TestCasNominal",  "4", "standard/suite × basse saison × avec/sans vue mer"],
    ["TestSaisonHaute", "4", "multiplicateur ×1.5 pour toutes les combinaisons"],
    ["TestCasComplexe", "4", "cumul de toutes les règles + long séjour"],
    ["TestCasLimite",   "3", "frontière exacte 7 nuits / 8 nuits / 1 nuit"],
    ["TestCasErreur",   "6", "durée ≤ 0, type inconnu, saison invalide, vides"],
    ["TOTAL",           "21", "100% des branches couvertes"],
]
tc_table = Table(test_classes, colWidths=[4.2*cm, 2*cm, 8.8*cm])
tc_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("FONTNAME", (1,1), (-1,-2), "Helvetica"),
    ("FONTNAME", (0,-1), (-1,-1), "Helvetica-Bold"),
    ("BACKGROUND", (0,-1), (-1,-1), colors.HexColor("#e8f4e8")),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ALIGN", (1,0), (1,-1), "CENTER"),
    ("ROWBACKGROUNDS", (0,1), (-1,-2), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(tc_table)
story.append(Spacer(1, 0.3*cm))

# extrait test
story.append(Paragraph("Extrait — TestCasComplexe (cas cumulant toutes les règles) :", body_bold))
test_extract = """\
def test_suite_haute_saison_vue_mer_long_sejour(self):
    \"\"\"
    (250 + 20) * 10 = 2700€
    2700€ * 1.5  (haute saison) = 4050€
    4050€ * 0.9  (réduction > 7 nuits) = 3645€
    \"\"\"
    prix = calculer_prix_chambre("suite", "haute", True, 10)
    assert prix == 3645.0

def test_standard_haute_saison_vue_mer_long_sejour(self):
    # (100+20)*8 = 960 → *1.5 = 1440 → *0.9 = 1296€
    prix = calculer_prix_chambre("standard", "haute", True, 8)
    assert prix == 1296.0"""
story.append(Preformatted(test_extract, code_style))

# ── 1.4 Résultats finaux ──────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("1.4  Exécution et résultats finaux", h2_style))
story.append(Preformatted("$ pytest --cov=booking_engine --cov-report=term-missing -v", code_style))
story.append(Spacer(1, 0.15*cm))

final_output = """\
========================= test session starts ==========================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
rootdir: .../atelier5
plugins: anyio-4.13.0, cov-7.1.0
collecting ... collected 21 items

test_booking.py::TestCasNominal::test_standard_basse_saison_sans_vue_mer   PASSED [  4%]
test_booking.py::TestCasNominal::test_standard_basse_saison_avec_vue_mer   PASSED [  9%]
test_booking.py::TestCasNominal::test_suite_basse_saison_sans_vue_mer      PASSED [ 14%]
test_booking.py::TestCasNominal::test_suite_basse_saison_avec_vue_mer      PASSED [ 19%]
test_booking.py::TestSaisonHaute::test_standard_haute_saison_sans_vue_mer  PASSED [ 23%]
test_booking.py::TestSaisonHaute::test_standard_haute_saison_avec_vue_mer  PASSED [ 28%]
test_booking.py::TestSaisonHaute::test_suite_haute_saison_sans_vue_mer     PASSED [ 33%]
test_booking.py::TestSaisonHaute::test_suite_haute_saison_avec_vue_mer     PASSED [ 38%]
test_booking.py::TestCasComplexe::test_suite_haute_saison_vue_mer_long_sejour     PASSED [ 42%]
test_booking.py::TestCasComplexe::test_standard_haute_saison_vue_mer_long_sejour  PASSED [ 47%]
test_booking.py::TestCasComplexe::test_suite_basse_saison_vue_mer_long_sejour     PASSED [ 52%]
test_booking.py::TestCasComplexe::test_standard_basse_saison_sans_vue_mer_long_sejour PASSED [ 57%]
test_booking.py::TestCasLimite::test_exactement_7_nuits_pas_de_reduction   PASSED [ 61%]
test_booking.py::TestCasLimite::test_8_nuits_reduction_appliquee           PASSED [ 66%]
test_booking.py::TestCasLimite::test_exactement_1_nuit                     PASSED [ 71%]
test_booking.py::TestCasErreur::test_duree_sejour_nulle                    PASSED [ 76%]
test_booking.py::TestCasErreur::test_duree_sejour_negative                 PASSED [ 80%]
test_booking.py::TestCasErreur::test_type_chambre_inconnu                  PASSED [ 85%]
test_booking.py::TestCasErreur::test_type_chambre_vide                     PASSED [ 90%]
test_booking.py::TestCasErreur::test_saison_inconnue                       PASSED [ 95%]
test_booking.py::TestCasErreur::test_saison_vide                           PASSED [100%]"""
story.append(Preformatted(final_output, code_style))

story.append(Spacer(1, 0.2*cm))
cov_final_output = """\
=========================== tests coverage ============================
Name                Stmts   Miss  Cover   Missing
-------------------------------------------------
booking_engine.py      20      0   100%
-------------------------------------------------
TOTAL                  20      0   100%

========================= 21 passed in 0.35s =========================="""
story.append(Preformatted(cov_final_output, code_style))

story.append(Spacer(1, 0.3*cm))

# Tableau comparatif couverture
cov_compare = [
    ["", "Avant les tests", "Après les tests"],
    ["Tests collectés",     "0",     "21"],
    ["Tests passés",        "0",     "21 ✔"],
    ["Tests échoués",       "0",     "0"],
    ["Statements couverts", "0/20",  "20/20"],
    ["Couverture (%)",      "0 %",   "100 %"],
]
cc_table = Table(cov_compare, colWidths=[5*cm, 4.5*cm, 4.5*cm])
cc_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (1,1), (-1,-1), "Helvetica"),
    ("TEXTCOLOR", (0,1), (0,-1), DARK_GRAY),
    ("BACKGROUND", (1,1), (1,-1), FAIL_RED),
    ("BACKGROUND", (2,1), (2,-1), PASS_GREEN),
    ("TEXTCOLOR", (1,1), (1,-1), ESPRIT_RED),
    ("TEXTCOLOR", (2,1), (2,-1), GREEN_OK),
    ("FONTNAME", (1,-1), (-1,-1), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
]))
story.append(cc_table)
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "✅  OBJECTIF ATTEINT : 21 tests passés — Couverture de code : 100%",
    success_style
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTIE 2 — TESTS FONCTIONNELS GHERKIN
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  PARTIE 2 : Tests Fonctionnels (Black Box / Gherkin)", h1_style))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "En tant qu'ingénieur QA, l'objectif est de traduire une <b>User Story</b> en "
    "scénarios de test comportementaux au format <b>Gherkin</b> (.feature), "
    "compréhensibles par des personnes non-techniques.",
    body_style
))

# ── 2.1 User Story ────────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("2.1  Spécification fonctionnelle — User Story", h2_style))

us_data = [
    ["Titre",       "Connexion de l'utilisateur"],
    ["En tant que", "Utilisateur enregistré"],
    ["Je veux",     "Me connecter à mon compte avec mon email et mot de passe"],
    ["Afin de",     "Accéder à mon tableau de bord personnel"],
]
us_table = Table(us_data, colWidths=[3.5*cm, 11.5*cm])
us_table.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("FONTNAME", (1,0), (1,-1), "Helvetica"),
    ("TEXTCOLOR", (0,0), (0,-1), ESPRIT_BLUE),
    ("TEXTCOLOR", (1,0), (1,-1), DARK_GRAY),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT_GRAY, colors.white]),
    ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(us_table)

story.append(Spacer(1, 0.2*cm))
story.append(Paragraph("Critères d'acceptance :", body_bold))
acceptance = [
    ["✔", "Si les identifiants sont corrects → redirection vers /dashboard"],
    ["✔", "Si le mot de passe est incorrect → message « Email ou mot de passe incorrect. »"],
    ["✔", "Si l'email n'existe pas → même message d'erreur s'affiche"],
]
acc_table = Table(acceptance, colWidths=[0.5*cm, 14.5*cm])
acc_table.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0,0), (0,-1), GREEN_OK),
    ("FONTNAME", (1,0), (1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9.5),
    ("TEXTCOLOR", (1,0), (1,-1), DARK_GRAY),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 4),
]))
story.append(acc_table)

# ── 2.2 Fichier Gherkin ───────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("2.2  Fichier généré — connexion.feature", h2_style))
story.append(Paragraph(
    "5 scénarios Gherkin couvrant les 3 critères d'acceptance obligatoires "
    "et 2 cas limites supplémentaires (champs vides, format email invalide) :",
    body_style
))

gherkin_code = """\
Feature: Connexion de l'utilisateur
  En tant que utilisateur enregistré
  Je veux me connecter à mon compte en utilisant mon email et mon mot de passe
  Afin d'accéder à mon tableau de bord personnel

  Scenario: Connexion réussie avec des identifiants valides
    Given un utilisateur enregistré avec l'email "utilisateur@exemple.com"
          et le mot de passe "MotDePasse123"
    When  il soumet le formulaire de connexion avec ces identifiants
    Then  il est redirigé vers "/dashboard"
    And   il voit son tableau de bord personnel

  Scenario: Échec de connexion avec un mot de passe incorrect
    Given un utilisateur enregistré avec l'email "utilisateur@exemple.com"
    When  il soumet le formulaire avec le mot de passe "MauvaisMotDePasse"
    Then  il reste sur la page de connexion
    And   il voit le message d'erreur "Email ou mot de passe incorrect."

  Scenario: Échec de connexion avec un email inexistant
    Given aucun compte n'est associé à l'email "inconnu@exemple.com"
    When  il soumet le formulaire avec cet email et un mot de passe quelconque
    Then  il reste sur la page de connexion
    And   il voit le message d'erreur "Email ou mot de passe incorrect."

  Scenario: Tentative de connexion avec des champs vides
    Given l'utilisateur est sur la page de connexion
    When  il soumet le formulaire sans renseigner l'email ni le mot de passe
    Then  il reste sur la page de connexion
    And   il voit un message indiquant que les champs sont obligatoires

  Scenario: Tentative de connexion avec un format d'email invalide
    Given l'utilisateur est sur la page de connexion
    When  il soumet le formulaire avec l'email "pas-un-email" et un mot de passe
    Then  il reste sur la page de connexion
    And   il voit un message d'erreur de format d'email invalide"""
story.append(Preformatted(gherkin_code, code_style))

# ── 2.3 Analyse ───────────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("2.3  Analyse de la structure Gherkin", h2_style))

analysis = [
    ["Mot-clé Gherkin", "Rôle", "Exemple dans le fichier"],
    ["Feature",   "Nom de la fonctionnalité + user story",   "Connexion de l'utilisateur"],
    ["Scenario",  "Un cas de test indépendant et nommé",     "Connexion réussie avec des identifiants valides"],
    ["Given",     "Contexte initial / précondition",         "un utilisateur enregistré avec l'email ..."],
    ["When",      "Action déclenchée par l'utilisateur",     "il soumet le formulaire de connexion ..."],
    ["Then",      "Résultat attendu observable",             "il est redirigé vers \"/dashboard\""],
    ["And",       "Prolonge le Given / When / Then",         "il voit son tableau de bord personnel"],
]
an_table = Table(analysis, colWidths=[2.8*cm, 4.5*cm, 7.7*cm])
an_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Courier-Bold"),
    ("TEXTCOLOR", (0,1), (0,-1), ESPRIT_BLUE),
    ("FONTNAME", (1,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(an_table)

story.append(Spacer(1, 0.3*cm))
# Vérification des critères
story.append(Paragraph("Vérification de la couverture des critères d'acceptance :", body_bold))
criteria_check = [
    ["Critère d'acceptance", "Scénario couvrant", "Statut"],
    ["Identifiants corrects → /dashboard",       "Scénario 1",  "✔ Couvert"],
    ["Mot de passe incorrect → message erreur",  "Scénario 2",  "✔ Couvert"],
    ["Email inexistant → même message erreur",   "Scénario 3",  "✔ Couvert"],
    ["Champs vides (cas limite bonus)",          "Scénario 4",  "✔ Couvert"],
    ["Format email invalide (cas limite bonus)", "Scénario 5",  "✔ Couvert"],
]
cr_table = Table(criteria_check, colWidths=[7*cm, 4*cm, 4*cm])
cr_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ("BACKGROUND", (2,1), (2,-1), PASS_GREEN),
    ("TEXTCOLOR", (2,1), (2,-1), GREEN_OK),
    ("FONTNAME", (2,1), (2,-1), "Helvetica-Bold"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(Spacer(1, 0.15*cm))
story.append(cr_table)

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "✅  Le fichier connexion.feature est compréhensible par une personne non-technique "
    "et couvre l'intégralité des critères d'acceptance de la User Story.",
    success_style
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# CONCLUSION — COMPARAISON WHITE BOX vs BLACK BOX
# ══════════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  CONCLUSION : White Box vs Black Box", h1_style))
story.append(Spacer(1, 0.4*cm))

comparison = [
    ["Critère",               "Test Unitaire (White Box)",              "Test Fonctionnel (Black Box)"],
    ["Perspective",           "Développeur",                            "Ingénieur QA / Utilisateur"],
    ["Accès au code source",  "Oui — le code est analysé",             "Non — boîte noire"],
    ["Granularité",           "Fonction / méthode isolée",             "Fonctionnalité complète"],
    ["Langage",               "Python (pytest)",                       "Gherkin (Given/When/Then)"],
    ["Fichier produit",       "test_booking.py",                       "connexion.feature"],
    ["Couverture mesurée",    "100% (statements)",                     "3/3 critères d'acceptance"],
    ["Lisible non-tech ?",    "Non — code Python",                     "Oui — langage naturel structuré"],
    ["Automatisable ?",       "Oui — pytest",                          "Oui — Behave, Cucumber..."],
]
comp_table = Table(comparison, colWidths=[4.2*cm, 5.9*cm, 5.9*cm])
comp_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0,1), (0,-1), ESPRIT_BLUE),
    ("FONTNAME", (1,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 6),
]))
story.append(comp_table)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("Bilan global de l'atelier", h2_style))
bilan = [
    ["Livrable",                        "Statut",     "Détail"],
    ["booking_engine.py",               "✔ Créé",     "Moteur de calcul de prix hôtelier"],
    ["test_booking.py",                 "✔ Créé",     "21 tests unitaires — 5 classes"],
    ["Couverture initiale",             "✔ Mesurée",  "0% (aucun test)"],
    ["Couverture finale",               "✔ Atteinte", "100% — 20/20 statements"],
    ["connexion.feature",               "✔ Créé",     "5 scénarios Gherkin"],
    ["Critères d'acceptance couverts",  "✔ Complets", "3/3 obligatoires + 2 bonus"],
]
bilan_table = Table(bilan, colWidths=[5.5*cm, 2.5*cm, 7*cm])
bilan_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTNAME", (1,1), (1,-1), "Helvetica-Bold"),
    ("TEXTCOLOR", (1,1), (1,-1), GREEN_OK),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("TOPPADDING", (0,0), (-1,-1), 5),
]))
story.append(Spacer(1, 0.15*cm))
story.append(bilan_table)

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"PDF généré avec succès : {OUTPUT}")
