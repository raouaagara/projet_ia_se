# generate_report_v2.py — PDF avec vraies captures d'écran PNG

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Image as RLImage
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import date
from PIL import Image as PILImage
import os

OUTPUT = "Rapport_Atelier5_Testing.pdf"
W, H   = A4
CONTENT_W = W - 4*cm   # marges 2cm de chaque côté

# ── Styles ───────────────────────────────────────────────────────────────────
styles      = getSampleStyleSheet()
ESPRIT_BLUE = colors.HexColor("#003087")
ESPRIT_RED  = colors.HexColor("#CC0000")
GREEN_OK    = colors.HexColor("#1a7a1a")
LIGHT_GRAY  = colors.HexColor("#f4f4f4")
DARK_GRAY   = colors.HexColor("#333333")
PASS_GREEN  = colors.HexColor("#d4edda")
FAIL_RED    = colors.HexColor("#f8d7da")

def sty(name, **kw):
    base = styles.get(name, styles["Normal"])
    return ParagraphStyle(name + "_custom", parent=base, **kw)

title_sty   = sty("Title",    textColor=ESPRIT_BLUE, fontSize=20,
                  alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=6)
sub_sty     = sty("Normal",   textColor=ESPRIT_BLUE, fontSize=13,
                  alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=4)
h1_sty      = sty("Heading1", textColor=colors.white, fontSize=13,
                  fontName="Helvetica-Bold", backColor=ESPRIT_BLUE,
                  spaceBefore=12, spaceAfter=6, leading=22, borderPad=6)
h2_sty      = sty("Heading2", textColor=ESPRIT_BLUE, fontSize=11,
                  fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
body_sty    = sty("Normal",   textColor=DARK_GRAY, fontSize=9.5,
                  leading=14, spaceAfter=4, fontName="Helvetica")
body_bold   = sty("Normal",   textColor=DARK_GRAY, fontSize=9.5,
                  leading=14, spaceAfter=4, fontName="Helvetica-Bold")
caption_sty = sty("Normal",   textColor=colors.HexColor("#555555"), fontSize=8,
                  alignment=TA_CENTER, fontName="Helvetica-Oblique", spaceAfter=6)
success_sty = sty("Normal",   textColor=GREEN_OK, fontSize=11,
                  fontName="Helvetica-Bold", backColor=PASS_GREEN,
                  borderPad=8, alignment=TA_CENTER, spaceAfter=6)

# ── Helper : insérer une capture PNG ────────────────────────────────────────
def screenshot(path, caption, max_w=None):
    """Retourne [Image, caption] mis à l'échelle pour tenir dans la page."""
    if max_w is None:
        max_w = CONTENT_W
    with PILImage.open(path) as im:
        iw, ih = im.size
    ratio  = max_w / iw
    rw, rh = max_w, ih * ratio
    # Ne pas dépasser la hauteur utile d'une page
    max_h  = H - 6*cm
    if rh > max_h:
        ratio  = max_h / ih
        rw, rh = iw * ratio, max_h
    img = RLImage(path, width=rw, height=rh)
    cap = Paragraph(caption, caption_sty)
    return [img, cap, Spacer(1, 0.25*cm)]

# ── Header / Footer ──────────────────────────────────────────────────────────
def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    w, h = A4
    # header
    canvas_obj.setFillColor(ESPRIT_BLUE)
    canvas_obj.rect(0, h-1.3*cm, w, 1.3*cm, fill=True, stroke=False)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(1*cm, h-0.85*cm, "IA for Software Engineering — UP_WEB")
    canvas_obj.drawRightString(w-1*cm, h-0.85*cm, "Année Universitaire : 2025-2026")
    # footer
    canvas_obj.setFillColor(ESPRIT_BLUE)
    canvas_obj.rect(0, 0, w, 0.9*cm, fill=True, stroke=False)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(1*cm, 0.32*cm, "Atelier 5 : Maîtriser le Testing avec GitHub Copilot")
    canvas_obj.drawRightString(w-1*cm, 0.32*cm, f"Page {doc.page}")
    canvas_obj.restoreState()

# ── Document ─────────────────────────────────────────────────────────────────
doc   = SimpleDocTemplate(OUTPUT, pagesize=A4,
                           topMargin=1.8*cm, bottomMargin=1.6*cm,
                           leftMargin=2*cm,  rightMargin=2*cm)
story = []

# ════════════════════════════════════════════════════════════════════════
# PAGE DE GARDE
# ════════════════════════════════════════════════════════════════════════
story += [
    Spacer(1, 1.5*cm),
    Paragraph("ESPRIT — Honoris United Universities", sub_sty),
    Spacer(1, 0.3*cm),
    HRFlowable(width="100%", thickness=2, color=ESPRIT_RED),
    Spacer(1, 0.5*cm),
    Paragraph("Atelier 5", sub_sty),
    Paragraph("Maîtriser le Testing avec GitHub Copilot", title_sty),
    Spacer(1, 0.3*cm),
    HRFlowable(width="100%", thickness=2, color=ESPRIT_RED),
    Spacer(1, 0.8*cm),
]

info_data = [
    ["Module :",        "IA for Software Engineering"],
    ["Filière :",       "UP_WEB"],
    ["Date :",          date.today().strftime("%d/%m/%Y")],
    ["Environnement :", "Python 3.11.9  |  pytest 9.1.1  |  pytest-cov 7.1.0"],
]
info_t = Table(info_data, colWidths=[4*cm, 11*cm])
info_t.setStyle(TableStyle([
    ("FONTNAME",      (0,0),(0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",     (0,0),(0,-1), ESPRIT_BLUE),
    ("FONTNAME",      (1,0),(1,-1), "Helvetica"),
    ("FONTSIZE",      (0,0),(-1,-1), 10),
    ("ROWBACKGROUNDS",(0,0),(-1,-1), [LIGHT_GRAY, colors.white]),
    ("GRID",          (0,0),(-1,-1), 0.3, colors.HexColor("#cccccc")),
    ("LEFTPADDING",   (0,0),(-1,-1), 8),
    ("TOPPADDING",    (0,0),(-1,-1), 5),
    ("BOTTOMPADDING", (0,0),(-1,-1), 5),
]))
story.append(info_t)
story.append(Spacer(1, 0.8*cm))

story.append(Paragraph("Objectifs", h2_sty))
for obj in [
    "Générer des tests unitaires pour valider une logique métier complexe.",
    "Mesurer la couverture de code : 0% → 100%.",
    "Traduire une User Story en scénarios Gherkin (Black Box).",
    "Comparer test unitaire (White Box) et test fonctionnel (Black Box).",
]:
    story.append(Paragraph(f"&nbsp;&nbsp;✔&nbsp;&nbsp;{obj}", body_sty))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════
# PARTIE 1 — TESTS UNITAIRES
# ════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  PARTIE 1 : Tests Unitaires (White Box)", h1_sty))
story.append(Spacer(1, 0.2*cm))

# ── Capture 4 : structure projet ────────────────────────────────────────
story.append(Paragraph("1.1  Structure du projet et environnement", h2_sty))
story.append(Paragraph(
    "Le projet est organisé dans le dossier <b>atelier5/</b> avec les trois fichiers "
    "principaux. Les outils pytest 9.1.1 et pytest-cov 7.1.0 sont installés.",
    body_sty))
story += screenshot("screenshot_04_structure_projet.png",
                    "Figure 1 — Structure du dossier atelier5 et versions installées")

# ── Capture 1 : couverture initiale ─────────────────────────────────────
story.append(Paragraph("1.2  Mesure de la couverture initiale (0%)", h2_sty))
story.append(Paragraph(
    "Avant d'écrire le moindre test, on exécute <b>pytest --cov=booking_engine</b> "
    "avec un fichier test_booking.py vide. Le résultat confirme <b>0% de couverture</b> : "
    "aucun test collecté, aucune donnée de couverture.",
    body_sty))
story += screenshot("screenshot_01_couverture_initiale.png",
                    "Figure 2 — Couverture initiale : 0% (aucun test exécuté)")

story.append(PageBreak())

# ── Capture 2 : tests partie 1 ──────────────────────────────────────────
story.append(Paragraph("1.3  Exécution de la suite de tests — 21 tests générés", h2_sty))
story.append(Paragraph(
    "La suite <b>test_booking.py</b> contient 21 tests répartis en 5 classes :"
    "<b> TestCasNominal</b>, <b>TestSaisonHaute</b>, <b>TestCasComplexe</b>, "
    "<b>TestCasLimite</b> et <b>TestCasErreur</b>. "
    "Chaque test est documenté avec le calcul attendu.",
    body_sty))

# Tableau des classes
tc_data = [
    ["Classe",           "Tests", "Cas couverts"],
    ["TestCasNominal",   "4",     "standard/suite × basse saison × avec/sans vue mer"],
    ["TestSaisonHaute",  "4",     "multiplicateur ×1.5 pour toutes les combinaisons"],
    ["TestCasComplexe",  "4",     "cumul de toutes les règles + long séjour"],
    ["TestCasLimite",    "3",     "frontière exacte 7 nuits / 8 nuits / 1 nuit"],
    ["TestCasErreur",    "6",     "durée ≤ 0, type inconnu, saison invalide, vides"],
    ["TOTAL",            "21",    "100% des branches"],
]
tc_t = Table(tc_data, colWidths=[4.2*cm, 1.5*cm, 9.3*cm])
tc_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(0,-2), "Courier-Bold"),
    ("FONTNAME",     (1,1),(-1,-2),"Helvetica"),
    ("FONTNAME",     (0,-1),(-1,-1),"Helvetica-Bold"),
    ("BACKGROUND",   (0,-1),(-1,-1), colors.HexColor("#e8f4e8")),
    ("TEXTCOLOR",    (0,-1),(-1,-1), GREEN_OK),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("ALIGN",        (1,0),(1,-1), "CENTER"),
    ("ROWBACKGROUNDS",(0,1),(-1,-2),[colors.white, LIGHT_GRAY]),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING",  (0,0),(-1,-1), 7),
    ("TOPPADDING",   (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
]))
story.append(tc_t)
story.append(Spacer(1, 0.3*cm))

story += screenshot("screenshot_02_tests_partie1.png",
                    "Figure 3 — Terminal : collecte et exécution des tests (lignes 1-11/21)")

story.append(PageBreak())

# ── Capture 3 : couverture finale ───────────────────────────────────────
story.append(Paragraph("1.4  Résultat final — 21 tests passés, couverture 100%", h2_sty))
story.append(Paragraph(
    "Tous les 21 tests passent en <b>0.35s</b>. Le rapport de couverture confirme "
    "<b>20/20 statements couverts (100%)</b>, sans aucune ligne manquante.",
    body_sty))
story += screenshot("screenshot_03_tests_partie2_couverture.png",
                    "Figure 4 — Terminal : 21 passed, couverture finale 100%")

story.append(Spacer(1, 0.2*cm))

# Tableau comparatif avant/après
cmp_data = [
    ["",                    "Avant les tests", "Après les tests"],
    ["Tests collectés",     "0",               "21"],
    ["Tests passés",        "0",               "21 ✔"],
    ["Statements couverts", "0 / 20",          "20 / 20"],
    ["Couverture",          "0 %",             "100 %"],
]
cmp_t = Table(cmp_data, colWidths=[5*cm, 4.5*cm, 4.5*cm])
cmp_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(0,-1), "Helvetica-Bold"),
    ("FONTNAME",     (1,1),(-1,-1),"Helvetica"),
    ("BACKGROUND",   (1,1),(1,-1), FAIL_RED),
    ("BACKGROUND",   (2,1),(2,-1), PASS_GREEN),
    ("TEXTCOLOR",    (1,1),(1,-1), ESPRIT_RED),
    ("TEXTCOLOR",    (2,1),(2,-1), GREEN_OK),
    ("FONTNAME",     (2,1),(2,-1), "Helvetica-Bold"),
    ("FONTSIZE",     (0,0),(-1,-1), 9),
    ("ALIGN",        (1,0),(-1,-1), "CENTER"),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING",  (0,0),(-1,-1), 8),
    ("TOPPADDING",   (0,0),(-1,-1), 6),
    ("BOTTOMPADDING",(0,0),(-1,-1), 6),
]))
story.append(cmp_t)
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("✅  OBJECTIF ATTEINT — 21 tests passés | Couverture : 100%", success_sty))
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════
# PARTIE 2 — TESTS FONCTIONNELS GHERKIN
# ════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  PARTIE 2 : Tests Fonctionnels (Black Box / Gherkin)", h1_sty))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("2.1  Spécification fonctionnelle — User Story", h2_sty))
us_data = [
    ["Titre",       "Connexion de l'utilisateur"],
    ["En tant que", "Utilisateur enregistré"],
    ["Je veux",     "Me connecter à mon compte avec email et mot de passe"],
    ["Afin de",     "Accéder à mon tableau de bord personnel"],
]
us_t = Table(us_data, colWidths=[3.5*cm, 11.5*cm])
us_t.setStyle(TableStyle([
    ("FONTNAME",      (0,0),(0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",     (0,0),(0,-1), ESPRIT_BLUE),
    ("FONTNAME",      (1,0),(1,-1), "Helvetica"),
    ("FONTSIZE",      (0,0),(-1,-1), 9.5),
    ("ROWBACKGROUNDS",(0,0),(-1,-1), [LIGHT_GRAY, colors.white]),
    ("GRID",          (0,0),(-1,-1), 0.3, colors.HexColor("#cccccc")),
    ("LEFTPADDING",   (0,0),(-1,-1), 8),
    ("TOPPADDING",    (0,0),(-1,-1), 5),
    ("BOTTOMPADDING", (0,0),(-1,-1), 5),
]))
story.append(us_t)
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph("Critères d'acceptance :", body_bold))
for ac in [
    "Si les identifiants sont corrects → redirection vers /dashboard",
    'Si le mot de passe est incorrect → message "Email ou mot de passe incorrect."',
    "Si l'email n'existe pas → même message d'erreur s'affiche",
]:
    story.append(Paragraph(f"&nbsp;&nbsp;✔&nbsp;&nbsp;{ac}", body_sty))

story.append(Spacer(1, 0.3*cm))

# ── Capture 5 : fichier feature ──────────────────────────────────────────
story.append(Paragraph("2.2  Fichier connexion.feature généré", h2_sty))
story.append(Paragraph(
    "Le fichier <b>connexion.feature</b> contient 5 scénarios Gherkin. "
    "Les 3 premiers couvrent les critères d'acceptance obligatoires. "
    "Les scénarios 4 et 5 couvrent des cas limites supplémentaires "
    "(champs vides, format email invalide).",
    body_sty))
story += screenshot("screenshot_05_connexion_feature.png",
                    "Figure 5 — Éditeur : fichier connexion.feature (syntaxe Gherkin colorée)")

story.append(PageBreak())

# Analyse Gherkin
story.append(Paragraph("2.3  Analyse de la structure Gherkin", h2_sty))
an_data = [
    ["Mot-clé",   "Rôle",                              "Exemple"],
    ["Feature",   "Nom + description user story",      "Connexion de l'utilisateur"],
    ["Scenario",  "Un cas de test nommé indépendant",  "Connexion réussie avec des identifiants valides"],
    ["Given",     "Contexte / précondition",           "un utilisateur enregistré avec l'email ..."],
    ["When",      "Action de l'utilisateur",           "il soumet le formulaire de connexion"],
    ["Then",      "Résultat observable attendu",       "il est redirigé vers \"/dashboard\""],
    ["And",       "Extension du précédent mot-clé",   "il voit son tableau de bord personnel"],
]
an_t = Table(an_data, colWidths=[2.5*cm, 4.8*cm, 7.7*cm])
an_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(0,-1), "Courier-Bold"),
    ("TEXTCOLOR",    (0,1),(0,-1), ESPRIT_BLUE),
    ("FONTNAME",     (1,1),(-1,-1),"Helvetica"),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT_GRAY]),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("VALIGN",       (0,0),(-1,-1), "TOP"),
    ("LEFTPADDING",  (0,0),(-1,-1), 6),
    ("TOPPADDING",   (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
]))
story.append(an_t)
story.append(Spacer(1, 0.3*cm))

# Couverture des critères
cr_data = [
    ["Critère d'acceptance",                             "Scénario",   "Statut"],
    ["Identifiants corrects → /dashboard",               "Scénario 1", "✔ Couvert"],
    ["Mot de passe incorrect → message erreur",          "Scénario 2", "✔ Couvert"],
    ["Email inexistant → même message erreur",           "Scénario 3", "✔ Couvert"],
    ["Champs vides (cas limite bonus)",                  "Scénario 4", "✔ Couvert"],
    ["Format email invalide (cas limite bonus)",         "Scénario 5", "✔ Couvert"],
]
cr_t = Table(cr_data, colWidths=[7.5*cm, 3.5*cm, 4*cm])
cr_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(-1,-1),"Helvetica"),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("ALIGN",        (1,0),(-1,-1), "CENTER"),
    ("BACKGROUND",   (2,1),(2,-1), PASS_GREEN),
    ("TEXTCOLOR",    (2,1),(2,-1), GREEN_OK),
    ("FONTNAME",     (2,1),(2,-1), "Helvetica-Bold"),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT_GRAY]),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING",  (0,0),(-1,-1), 7),
    ("TOPPADDING",   (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
]))
story.append(cr_t)
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "✅  Le fichier connexion.feature est compréhensible par une personne non-technique "
    "et couvre intégralement les critères d'acceptance de la User Story.",
    success_sty))
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════════════
# CONCLUSION
# ════════════════════════════════════════════════════════════════════════
story.append(Paragraph("  CONCLUSION : White Box vs Black Box", h1_sty))
story.append(Spacer(1, 0.4*cm))

cmp2_data = [
    ["Critère",               "Test Unitaire (White Box)",       "Test Fonctionnel (Black Box)"],
    ["Perspective",           "Développeur",                     "Ingénieur QA / Utilisateur"],
    ["Accès au code source",  "Oui",                             "Non — boîte noire"],
    ["Granularité",           "Fonction isolée",                 "Fonctionnalité complète"],
    ["Langage",               "Python / pytest",                 "Gherkin (Given/When/Then)"],
    ["Fichier produit",       "test_booking.py",                 "connexion.feature"],
    ["Couverture",            "100% statements",                 "3/3 critères d'acceptance"],
    ["Lisible non-tech ?",    "Non",                             "Oui — langage naturel"],
    ["Automatisable ?",       "Oui — pytest",                   "Oui — Behave, Cucumber..."],
]
cmp2_t = Table(cmp2_data, colWidths=[4.5*cm, 5.5*cm, 5*cm])
cmp2_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",    (0,1),(0,-1), ESPRIT_BLUE),
    ("FONTNAME",     (1,1),(-1,-1),"Helvetica"),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT_GRAY]),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("VALIGN",       (0,0),(-1,-1), "TOP"),
    ("LEFTPADDING",  (0,0),(-1,-1), 7),
    ("TOPPADDING",   (0,0),(-1,-1), 6),
    ("BOTTOMPADDING",(0,0),(-1,-1), 6),
]))
story.append(cmp2_t)
story.append(Spacer(1, 0.5*cm))

bilan_data = [
    ["Livrable",                         "Statut",      "Détail"],
    ["booking_engine.py",                "✔ Créé",      "Moteur de calcul hôtelier"],
    ["test_booking.py",                  "✔ Créé",      "21 tests unitaires — 5 classes"],
    ["Couverture initiale",              "✔ Mesurée",   "0% (aucun test)"],
    ["Couverture finale",                "✔ 100%",      "20/20 statements — 0 manquant"],
    ["connexion.feature",                "✔ Créé",      "5 scénarios Gherkin"],
    ["Critères d'acceptance",            "✔ Complets",  "3/3 obligatoires + 2 bonus"],
]
bilan_t = Table(bilan_data, colWidths=[5.5*cm, 2.5*cm, 7*cm])
bilan_t.setStyle(TableStyle([
    ("BACKGROUND",   (0,0),(-1,0), ESPRIT_BLUE),
    ("TEXTCOLOR",    (0,0),(-1,0), colors.white),
    ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
    ("FONTNAME",     (0,1),(-1,-1),"Helvetica"),
    ("FONTNAME",     (1,1),(1,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",    (1,1),(1,-1), GREEN_OK),
    ("FONTSIZE",     (0,0),(-1,-1), 9),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT_GRAY]),
    ("GRID",         (0,0),(-1,-1), 0.4, colors.HexColor("#cccccc")),
    ("LEFTPADDING",  (0,0),(-1,-1), 7),
    ("TOPPADDING",   (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
]))
story.append(bilan_t)

# ── Build ─────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"PDF généré avec succès : {OUTPUT}")
