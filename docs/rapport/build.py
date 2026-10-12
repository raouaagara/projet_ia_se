# -*- coding: utf-8 -*-
"""Génère le rapport MediCare (HTML -> PDF via Chromium/Playwright).

Prérequis : Python 3 + pypdf, Node.js avec le paquet « playwright » (Chromium), pdftotext (poppler).
Les diagrammes SVG de diagrams/ sont produits à partir des sources .puml avec PlantUML + Graphviz :
    java -jar plantuml.jar -tsvg diagrams/*.puml
Le contenu (modules, user stories, API...) se modifie dans data.py, puis : python3 build.py
"""
import json, os, re, subprocess, sys
from html import escape as esc

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data import ACTEURS, BNF, MODULES, DEPENDANCES, GLOSSAIRE

ROOT = os.path.dirname(os.path.abspath(__file__))
DIAG = os.path.join(ROOT, "diagrams")
OUT = os.path.join(ROOT, "build")
os.makedirs(OUT, exist_ok=True)

PRIO_CLS = {"Haute": "p-h", "Moyenne": "p-m", "Basse": "p-b"}


def badge(statut):
    return '<span class="b-new">Nouveau</span>' if statut == "N" else '<span class="b-old">Existant</span>'


def story(u):
    que = "qu'" if u[1][0].lower() in "aeiouéèêh" else "que "
    return f"En tant {que}<b>{esc(u[1])}</b>, je veux {esc(u[2])} afin de {esc(u[3])}."


class Doc:
    def __init__(self, pages):
        self.pages = pages or {}
        self.parts, self.toc, self.figs, self.tabs = [], [], [], []
        self.ch = 0; self.sec = 0; self.fig = 0; self.tab = 0; self.k = 0
        self.chnum = ""
        self.capp = ""

    def key(self):
        self.k += 1
        return f"K{self.k:03d}"

    def mark(self, k):
        return f'<span class="mk">@@{k}@@</span>'

    def add(self, html):
        self.parts.append(html)

    def chapter(self, title, numbered=True, kicker=None, prefix=""):
        k = self.key()
        if numbered:
            self.ch += 1; self.sec = 0; self.fig = 0; self.tab = 0
            self.chnum = str(self.ch); self.capp = self.chnum
            label = f"Chapitre {self.ch}"
            self.toc.append((1, f"{label} — {title}", k))
            kick = kicker or label
            self.add(f'<h1 class="chap">{self.mark(k)}<span class="kicker">{esc(kick)}</span>{esc(title)}</h1>')
        else:
            self.chnum = ""; self.capp = prefix
            if prefix:
                self.fig = 0; self.tab = 0
            self.toc.append((1, title, k))
            self.add(f'<h1 class="chap plain">{self.mark(k)}{esc(title)}</h1>')

    def section(self, title, toc=True):
        k = self.key()
        if self.chnum:
            self.sec += 1
            full = f"{self.chnum}.{self.sec} {title}"
        else:
            full = title
        if toc:
            self.toc.append((2, full, k))
        self.add(f'<h2>{self.mark(k)}{esc(full)}</h2>')

    def open(self, cls):
        self.add(f'<div class="{cls}">')

    def close(self):
        self.add("</div>")

    def sub(self, title):
        self.add(f"<h3>{esc(title)}</h3>")

    def p(self, text):
        self.add(f"<p>{text}</p>")

    def ul(self, items, cls=""):
        self.add(f'<ul class="{cls}">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>")

    def _num(self, kind):
        if kind == "fig":
            self.fig += 1; n = self.fig
        else:
            self.tab += 1; n = self.tab
        return f"{self.capp}.{n}" if self.capp else f"{n}"

    def figure(self, name, caption, size="full", landscape=False):
        num = self._num("fig"); k = self.key()
        self.figs.append((f"Figure {num} — {caption}", k))
        img = f'<img src="../diagrams/{name}.svg" alt="{esc(caption)}">'
        fig = (f'<figure class="fig {size}">{img}<figcaption>{self.mark(k)}'
               f'<b>Figure {num}</b> — {esc(caption)}</figcaption></figure>')
        if landscape:
            fig = f'<div class="land">{fig}</div>'
        self.add(fig)

    def table(self, headers, rows, caption, widths=None, cls=""):
        num = self._num("tab"); k = self.key()
        self.tabs.append((f"Tableau {num} — {caption}", k))
        cols = "".join(f'<col style="width:{w}">' for w in widths) if widths else ""
        th = "".join(f"<th>{h}</th>" for h in headers)
        trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
        self.add(f'<table class="t {cls}"><caption>{self.mark(k)}<b>Tableau {num}</b> — {esc(caption)}</caption>'
                 f'<colgroup>{cols}</colgroup><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>')

    def pg(self, k):
        v = self.pages.get(k)
        return str(v) if v else "00"

    def front_matter(self):
        toc = ['<h1 class="chap plain">Sommaire</h1><div class="toc">']
        for lvl, title, k in self.toc:
            toc.append(f'<div class="tl l{lvl}"><span class="tt">{esc(title)}</span><span class="dots"></span><span class="pn">{self.pg(k)}</span></div>')
        toc.append("</div>")
        lst = ['<h1 class="chap plain">Liste des figures</h1><div class="toc lof">']
        for title, k in self.figs:
            lst.append(f'<div class="tl l2"><span class="tt">{esc(title)}</span><span class="dots"></span><span class="pn">{self.pg(k)}</span></div>')
        lst.append('</div><h2 class="lot">Liste des tableaux</h2><div class="toc lof">')
        for title, k in self.tabs:
            lst.append(f'<div class="tl l2"><span class="tt">{esc(title)}</span><span class="dots"></span><span class="pn">{self.pg(k)}</span></div>')
        lst.append("</div>")
        return "".join(toc) + "".join(lst)


def build_body(pages):
    d = Doc(pages)
    total_sp = sum(u[5] for m in MODULES for u in m["us"])
    n_us = sum(len(m["us"]) for m in MODULES)

    # ---------------------------------------------------------------- Introduction
    d.chapter("Introduction générale", numbered=False)
    d.p("La gestion d'une clinique médicale mobilise de nombreux acteurs — administration, secrétariat, médecins, "
        "laboratoire, pharmacie et patients — autour d'informations sensibles et fortement liées : rendez-vous, "
        "consultations, prescriptions, examens, médicaments et factures. Lorsque ces informations sont dispersées "
        "entre des registres papier, des tableurs et des échanges téléphoniques, les erreurs, les doublons et les "
        "pertes de temps se multiplient.")
    d.p("<b>MediCare</b> est une plateforme web full-stack (Spring Boot, Angular, MySQL) qui centralise ces processus. "
        "Une première version fonctionnelle couvre déjà l'authentification par rôle, les rendez-vous, les consultations, "
        "la facturation, le laboratoire, les notifications et un assistant conversationnel. Ce rapport décrit "
        "l'évolution du projet par une équipe de <b>six membres</b> : le périmètre est réorganisé en <b>six modules</b>, "
        "dont deux nouveaux — <b>IA &amp; Aide à la décision</b> et <b>Pharmacie &amp; Stock</b> — et chaque module "
        "constitue un <b>sprint</b> confié à un responsable.")
    d.p("Le rapport est organisé comme suit. Le <b>chapitre 1</b> présente le contexte, les objectifs, l'architecture "
        "et la méthodologie Scrum. Le <b>chapitre 2</b> spécifie les besoins fonctionnels et non fonctionnels et présente "
        "le diagramme de cas d'utilisation global, le diagramme de classes global et le product backlog. Le "
        "<b>chapitre 3</b> planifie les sprints, les dépendances et les règles de collaboration. Les <b>chapitres 4 à 9</b> "
        "détaillent chacun un sprint : sprint backlog, cas d'utilisation, description textuelle, diagramme de classes, "
        "diagramme de séquence, API REST et livrables.")

    # ---------------------------------------------------------------- Chapitre 1
    d.chapter("Présentation générale du projet")
    d.section("Contexte")
    d.p("Le projet s'inscrit dans la numérisation du parcours patient d'une clinique privée. La clinique doit "
        "coordonner l'accueil, les consultations, les analyses de laboratoire, la délivrance des médicaments et la "
        "facturation, tout en garantissant la confidentialité des données de santé et en offrant aux patients un "
        "accès autonome à leurs informations.")
    d.section("Problématique")
    d.ul(["Les rendez-vous sont pris sans vision fiable des disponibilités réelles des médecins, ce qui provoque des chevauchements et des attentes.",
          "Les ordonnances sont rédigées en texte libre : elles ne peuvent être ni contrôlées, ni délivrées, ni facturées automatiquement.",
          "Les résultats d'examens ne sont pas structurés : les valeurs anormales ne sont pas mises en évidence et leur évolution n'est pas suivie.",
          "La pharmacie et le stock de médicaments ne sont pas gérés : ruptures et péremptions ne sont détectées qu'a posteriori.",
          "Les décideurs disposent de statistiques mais d'aucune capacité d'anticipation, et l'assistant IA appelle l'API externe depuis le navigateur."])
    d.section("Objectifs")
    d.ul(["Offrir à chaque acteur un espace dédié et sécurisé selon son rôle.",
          "Fiabiliser la prise de rendez-vous à partir des plages horaires et indisponibilités des médecins.",
          "Couvrir le parcours de soin de bout en bout : consultation → ordonnance → examens → délivrance → facture.",
          "Ajouter une pharmacie avec gestion des lots, délivrance FEFO et alertes automatiques.",
          "Mettre l'intelligence artificielle au service des patients (pré-triage), des médecins (résumé, interprétation) et de la direction (prévisions), de manière sécurisée et responsable.",
          "Organiser le travail de six membres en modules indépendants, livrés en sprints."])
    d.section("Solution proposée et découpage en modules")
    d.p("La plateforme est découpée en six modules fonctionnels. Les quatre premiers consolident et enrichissent "
        "l'existant ; les deux derniers sont nouveaux. Chaque module regroupe ses entités, services, contrôleurs REST "
        "et pages Angular, ce qui permet à chaque membre de travailler de manière autonome.")
    d.table(["Module", "Intitulé", "Statut", "Périmètre"],
            [[f"<b>{m['code']}</b>", esc(m["titre"]),
              '<span class="b-new">Nouveau</span>' if m["statut"] == "Nouveau" else '<span class="b-old">Existant</span>',
              esc(m["objectif"].split(":")[0] if False else m["objectif"])] for m in MODULES],
            "Les six modules de MediCare", ["9%", "24%", "11%", "56%"])
    d.section("Architecture technique")
    d.p("MediCare suit une architecture client-serveur en trois niveaux. Le frontend Angular communique avec le "
        "backend Spring Boot par une API REST/JSON protégée par JWT ; le backend persiste les données dans MySQL via "
        "Spring Data JPA et appelle l'API d'IA Groq de manière exclusive (la clé n'est jamais exposée au navigateur).")
    d.figure("00_architecture", "Architecture technique de MediCare", size="mid")
    d.table(["Couche", "Technologies", "Rôle"],
            [["Frontend", "Angular 17 (composants standalone), TypeScript 5.4, RxJS 7.8", "Espaces par rôle, formulaires, guards et intercepteur JWT"],
             ["Backend", "Java 17, Spring Boot 3.2.5, Spring Security, JJWT 0.12.5, Lombok", "API REST, règles métier, sécurité, tâches planifiées"],
             ["Persistance", "Spring Data JPA / Hibernate, MySQL 8", "Stockage relationnel, schéma généré (ddl-auto=update)"],
             ["Documentation", "springdoc-openapi 2.5 (Swagger UI)", "Documentation interactive de l'API"],
             ["Intelligence artificielle", "API Groq (modèle de langage), client HTTP côté serveur", "Assistant, pré-triage, résumé, interprétation"],
             ["Outils", "Git / GitHub, Maven, npm, PlantUML", "Versionnement, build, diagrammes UML"]],
            "Choix technologiques", ["18%", "44%", "38%"])
    d.section("Méthodologie de travail : Scrum")
    d.p("Le projet adopte <b>Scrum</b>, cadre agile itératif et incrémental adapté à une équipe de six personnes. "
        "Le backlog produit est priorisé, puis réparti en sprints ; à la fin de chaque sprint, un incrément "
        "fonctionnel est démontré et une rétrospective permet d'améliorer le fonctionnement de l'équipe.")
    d.table(["Rôle Scrum", "Responsabilités", "Titulaire"],
            [["Product Owner", "Porte la vision, priorise le product backlog, valide les livraisons", "Encadrant(e) ou membre désigné : ____________"],
             ["Scrum Master", "Anime les cérémonies, lève les obstacles, veille au respect du cadre", "Membre désigné (rotation possible) : ____________"],
             ["Équipe de développement", "Six membres ; chacun est responsable d'un module / sprint de bout en bout (backend + frontend + tests)", "Voir tableau 3.1"]],
            "Rôles Scrum", ["20%", "52%", "28%"])
    d.ul(["<b>Sprint planning</b> : sélection des user stories et découpage en tâches au début de chaque sprint.",
          "<b>Daily scrum</b> : point de 15 minutes (présentiel ou en ligne) — fait hier, prévu aujourd'hui, obstacles.",
          "<b>Sprint review</b> : démonstration de l'incrément au Product Owner.",
          "<b>Rétrospective</b> : bilan de l'équipe et actions d'amélioration.",
          "<b>Estimation</b> : story points (suite de Fibonacci 1, 2, 3, 5, 8) pour les user stories, heures pour les tâches."])

    # ---------------------------------------------------------------- Chapitre 2
    d.chapter("Analyse et spécification des besoins")
    d.section("Identification des acteurs")
    d.table(["Acteur", "Rôle applicatif", "Description"],
            [[f"<b>{esc(a)}</b>", esc(r), esc(t)] for a, r, t in ACTEURS],
            "Acteurs du système", ["20%", "20%", "60%"])
    d.section("Besoins fonctionnels")
    d.p("Les besoins fonctionnels décrivent ce que le système doit permettre. Ils sont regroupés par module et "
        "identifiés afin d'être tracés jusqu'aux user stories.")
    for m in MODULES:
        d.sub(f"{m['code']} — {m['titre']}")
        d.add('<p class="lead">Le système doit :</p>')
        d.ul([f'<span class="rid">BF-{m["code"]}-{i+1:02d}</span> {esc(b)}' for i, b in enumerate(m["bf"])], "bf")
    d.section("Besoins non fonctionnels")
    d.p("Les besoins non fonctionnels définissent les qualités attendues du système. Chacun est associé à un critère "
        "de vérification.")
    d.table(["ID", "Catégorie", "Exigence", "Critère de vérification"],
            [[f"<b>{i}</b>", esc(c), esc(e), esc(v)] for c, i, e, v in BNF],
            "Besoins non fonctionnels", ["9%", "14%", "50%", "27%"])
    d.open("keep")
    d.section("Diagramme de cas d'utilisation global")
    d.p("Le diagramme suivant présente les principaux cas d'utilisation de chaque module et les acteurs qui les "
        "déclenchent. Les cas d'utilisation sur fond orange sont nouveaux. Chaque module est raffiné dans le chapitre "
        "du sprint correspondant.")
    d.figure("01_uc_global", "Diagramme de cas d'utilisation global", size="full")
    d.close()
    d.open("land")
    d.section("Diagramme de classes global")
    d.p("Le diagramme de classes global montre les entités persistantes et leurs associations, regroupées par module. "
        "Les attributs sont détaillés dans les diagrammes de chaque sprint. Légende : <span class='lg old'>bleu</span> "
        "classe existante, <span class='lg new'>orange</span> classe nouvelle.")
    d.figure("02_classes_global", "Diagramme de classes global (par module)")
    d.close()
    rows = []
    cls_desc = [
        ("Utilisateur", "M1", "E", "Compte d'accès : identifiants, rôle, état actif."),
        ("Patient / Medecin", "M1", "E", "Profils métier rattachés à un utilisateur."),
        ("JournalAudit", "M1", "N", "Trace des actions sensibles."),
        ("RendezVous", "M2", "E", "Rendez-vous patient-médecin et son statut."),
        ("PlageHoraire / Indisponibilite", "M2", "N", "Semaine type et absences d'un médecin."),
        ("Notification", "M2", "E", "Message adressé à un utilisateur (application ou email)."),
        ("Consultation", "M3", "E", "Acte médical réalisé lors d'un rendez-vous."),
        ("Ordonnance / LigneOrdonnance", "M3", "E / N", "Prescription et ses lignes structurées."),
        ("Facture / LigneFacture", "M3", "E", "Facturation d'un patient."),
        ("ActeMedical / Paiement", "M3", "N", "Catalogue tarifaire et encaissements."),
        ("ExamenLaboratoire", "M4", "E", "Examen prescrit et son cycle de vie."),
        ("TypeExamen / ParametreExamen / ResultatParametre", "M4", "N", "Catalogue d'examens, valeurs de référence et résultats structurés."),
        ("ConversationIA / MessageIA", "M5", "N", "Historique des échanges avec l'assistant."),
        ("TriageSymptomes / AnalyseIA", "M5", "N", "Résultats du pré-triage et analyses générées par l'IA."),
        ("Medicament / LotMedicament / Fournisseur", "M6", "N", "Catalogue, lots avec péremption, fournisseurs."),
        ("MouvementStock", "M6", "N", "Entrées, sorties, ajustements et péremptions."),
        ("Delivrance / LigneDelivrance", "M6", "N", "Délivrance (totale ou partielle) d'une ordonnance."),
    ]
    for c, mo, st, de in cls_desc:
        b = '<span class="b-old">Existant</span>' if st == "E" else ('<span class="b-new">Nouveau</span>' if st == "N" else '<span class="b-old">Existant</span> <span class="b-new">Nouveau</span>')
        rows.append([f"<b>{esc(c)}</b>", mo, b, esc(de)])
    d.table(["Classe(s)", "Module", "Statut", "Description"], rows, "Dictionnaire des classes", ["30%", "9%", "17%", "44%"])
    d.section("Product backlog")
    d.p(f"Le product backlog regroupe les <b>{n_us} user stories</b> du projet, pour un total de <b>{total_sp} story points</b>. "
        "La priorité indique l'ordre de réalisation à l'intérieur de chaque sprint ; la colonne « Statut » distingue "
        "les fonctionnalités existantes à consolider des fonctionnalités nouvelles.")
    rows = []
    for m in MODULES:
        rows.append([f'<b>Sprint {m["sprint"]} — {m["code"]} · {esc(m["titre"])}</b>', "", "", "", ""])
        for u in m["us"]:
            rows.append([f"<b>US-{u[0]}</b>", story(u), badge(u[6]), f'<span class="{PRIO_CLS[u[4]]}">{u[4]}</span>', str(u[5])])
    d.table(["ID", "User story", "Statut", "Priorité", "SP"], rows, "Product backlog", ["8%", "62%", "11%", "11%", "8%"], cls="pb")

    # ---------------------------------------------------------------- Chapitre 3
    d.chapter("Planification des sprints")
    d.section("Répartition des modules et des sprints")
    d.p("Chaque module correspond à un sprint dont un membre est responsable de bout en bout (entités, services, "
        "API, pages Angular, tests et données de démonstration). Les six sprints se déroulent <b>en parallèle</b> : "
        "l'équipe compte six membres et les modules ont été dimensionnés pour une charge comparable.")
    rows = []
    for m in MODULES:
        sp = sum(u[5] for u in m["us"]); h = sum(t[1] for u in m["us"] for t in u[7])
        rows.append([f"<b>Sprint {m['sprint']}</b>", f"<b>{m['code']}</b> · {esc(m['titre'])}",
                     '<span class="b-new">Nouveau</span>' if m["statut"] == "Nouveau" else '<span class="b-old">Existant</span>',
                     str(len(m["us"])), str(sp), f"{h} h", "____________"])
    d.table(["Sprint", "Module", "Statut", "US", "SP", "Charge", "Responsable"], rows,
            "Répartition des sprints entre les membres", ["11%", "33%", "12%", "6%", "6%", "9%", "23%"])
    d.section("Calendrier prévisionnel")
    d.p("Le calendrier s'étend sur six semaines : une semaine de préparation commune (sprint 0), trois semaines de "
        "développement des modules en parallèle, une semaine d'intégration et une semaine de recette et de "
        "préparation de la soutenance. Les durées sont indicatives et pourront être ajustées par le Product Owner.")
    weeks = ["S1", "S2", "S3", "S4", "S5", "S6"]
    plan = [("Sprint 0 — Préparation commune", [0], "c0"),
            *[(f"Sprint {m['sprint']} — {m['code']} {m['titre']}", [1, 2, 3], "c1" if m["statut"] == "Existant" else "c2") for m in MODULES],
            ("Sprint 7 — Intégration des modules", [4], "c3"),
            ("Recette, données de démo, soutenance", [5], "c4")]
    g = ['<table class="gantt"><caption>' + d.mark(d.key()) + '</caption><thead><tr><th>Activité</th>' + "".join(f"<th>{w}</th>" for w in weeks) + "</tr></thead><tbody>"]
    for label, ws, c in plan:
        g.append(f"<tr><td>{esc(label)}</td>" + "".join(f'<td class="{c if i in ws else ""}"></td>' for i in range(6)) + "</tr>")
    g.append("</tbody></table>")
    d.add("".join(g))
    num = d._num("tab"); k = d.key(); d.tabs.append((f"Tableau {num} — Calendrier prévisionnel (semaines)", k))
    d.add(f'<p class="cap">{d.mark(k)}<b>Tableau {num}</b> — Calendrier prévisionnel (semaines). '
          '<span class="lg old">bleu</span> module existant, <span class="lg new">orange</span> module nouveau.</p>')
    d.sub("Contenu du sprint 0 (préparation commune)")
    d.ul(["Installation de l'environnement par chaque membre (Java 17, Node 18, MySQL 8) et lancement du projet.",
          "Découpage de <code>core/api.service.ts</code> en un service Angular par module pour éviter les conflits Git.",
          "Ajout en une seule fois des valeurs partagées : <code>Role.PHARMACIEN</code>, <code>StatutRendezVous.ABSENT</code>, nouveaux <code>TypeNotification</code>.",
          "Validation des contrats d'interface entre modules (tableau 3.3).",
          "Création d'une branche Git par module et règles de revue (section 3.5)."])
    d.sub("Contenu du sprint 7 (intégration)")
    d.ul(["Parcours de bout en bout : pré-triage IA → rendez-vous → consultation → ordonnance → examen → délivrance → facture → paiement.",
          "Résultat d'examen anormal → interprétation IA → validation par le médecin.",
          "Tests de non-régression des droits d'accès pour les six rôles et mise à jour du README."])
    d.section("Dépendances entre modules")
    d.p("Les modules échangent uniquement au travers de contrats explicites (méthodes de service ou endpoints). Ces "
        "contrats sont figés au sprint 0 afin que chaque responsable puisse avancer sans attendre les autres, en "
        "simulant au besoin la partie manquante.")
    d.table(["Fournisseur", "Consommateur", "Contrat d'interface", "Remarque"],
            [[f"<b>{a}</b>", b, f"<code>{esc(c)}</code>", esc(r)] for a, b, c, r in DEPENDANCES],
            "Contrats d'interface entre modules", ["12%", "14%", "44%", "30%"])
    d.section("Définition de « Terminé »")
    d.p("Une user story est considérée comme terminée lorsque :")
    d.ul(["le code compile et l'application démarre (backend et frontend) ;",
          "les endpoints sont sécurisés par rôle et visibles dans Swagger UI ;",
          "la page Angular est accessible depuis le menu de l'espace concerné ;",
          "des données de démonstration sont ajoutées au DataSeeder ;",
          "les tests unitaires des services concernés passent ;",
          "la pull request a été relue et approuvée par un autre membre ;",
          "aucun secret (mot de passe, clé) n'est présent dans le code."])
    d.section("Règles de collaboration")
    d.table(["Règle", "Description"],
            [["Branches", "Une branche par module (<code>module/m1-utilisateurs</code>, …, <code>module/m6-pharmacie</code>) ; fusion dans <code>main</code> par pull request uniquement."],
             ["Fichiers partagés", "Chaque fichier partagé a un propriétaire : <code>SecurityConfig</code> et <code>Role</code> (M1), <code>NotificationService</code> (M2), <code>FactureService</code> (M3). Les autres membres demandent une modification au propriétaire."],
             ["Routage Angular", "Chaque responsable n'ajoute que le bloc de routes de son module dans <code>app.routes.ts</code>."],
             ["Données de démo", "Une méthode d'initialisation par module dans le DataSeeder pour limiter les conflits."],
             ["Revue", "Toute pull request est relue par un autre membre ; un module ne modifie pas les tables d'un autre module."]],
            "Règles de collaboration", ["20%", "80%"])

    # ---------------------------------------------------------------- Sprints
    for m in MODULES:
        d.chapter(f"Sprint {m['sprint']} — {m['code']} · {m['titre']}", kicker=f"Chapitre {d.ch + 1} · Sprint {m['sprint']}")
        sp = sum(u[5] for u in m["us"]); h = sum(t[1] for u in m["us"] for t in u[7])
        d.add(f'<div class="meta"><span><b>Module</b> {m["code"]} · {esc(m["statut"])}</span><span><b>Durée</b> 3 semaines</span>'
              f'<span><b>User stories</b> {len(m["us"])}</span><span><b>Story points</b> {sp}</span><span><b>Charge estimée</b> {h} h</span>'
              f'<span><b>Responsable</b> ____________</span></div>')
        d.section("Objectif et périmètre du sprint")
        d.add(f'<div class="goal"><b>Objectif du sprint.</b> {esc(m["objectif"])}</div>')
        d.add('<div class="two"><div class="box old"><h4>Point de départ (existant)</h4><ul>' +
              "".join(f"<li>{esc(x)}</li>" for x in m["existant"]) +
              '</ul></div><div class="box new"><h4>À réaliser dans ce sprint</h4><ul>' +
              "".join(f"<li>{esc(x)}</li>" for x in m["nouveau"]) + "</ul></div></div>")
        d.section("Sprint backlog")
        rows = []
        for u in m["us"]:
            tasks = "<ul class='tk'>" + "".join(f"<li>{esc(t)} <span class='hh'>{hh} h</span></li>" for t, hh in u[7]) + "</ul>"
            rows.append([f"<b>US-{u[0]}</b><br>{badge(u[6])}", f"<div class='us'>{story(u)}</div>{tasks}",
                         f'<span class="{PRIO_CLS[u[4]]}">{u[4]}</span>', str(u[5]), f"{sum(t[1] for t in u[7])} h"])
        rows.append(["", "<b>Total du sprint</b>", "", f"<b>{sp}</b>", f"<b>{h} h</b>"])
        d.table(["ID", "User story et tâches techniques", "Priorité", "SP", "Charge"], rows,
                f"Sprint backlog du sprint {m['sprint']}", ["10%", "64%", "10%", "7%", "9%"], cls="sb")
        d.open("keep")
        d.section("Diagramme de cas d'utilisation")
        d.p(f"Le diagramme ci-dessous raffine le module {m['code']}. Les cas d'utilisation sur fond orange sont "
            "nouveaux ; les relations « include » désignent un comportement toujours exécuté, les relations "
            "« extend » un comportement optionnel." if m["code"] != "M6" else
            "Le diagramme ci-dessous détaille le module M6, entièrement nouveau. Les relations « include » désignent "
            "un comportement toujours exécuté, les relations « extend » un comportement optionnel.")
        d.figure(m["uc"][0], m["uc"][1], size="full")
        d.close()
        u = m["ucd"]
        d.open("keep")
        d.section(f"Description textuelle : « {u['titre']} »")
        nominal = "<ol>" + "".join(f"<li>{esc(x)}</li>" for x in u["nominal"]) + "</ol>"
        alt = "<ul class='alt'>" + "".join(f"<li>{esc(x)}</li>" for x in u["alt"]) + "</ul>"
        d.table(["Rubrique", "Description"],
                [["<b>Cas d'utilisation</b>", esc(u["titre"])], ["<b>Acteurs</b>", esc(u["acteurs"])],
                 ["<b>Pré-conditions</b>", esc(u["pre"])], ["<b>Post-conditions</b>", esc(u["post"])],
                 ["<b>Scénario nominal</b>", nominal], ["<b>Scénarios alternatifs</b>", alt]],
                f"Description du cas d'utilisation « {u['titre']} »", ["22%", "78%"], cls="ucd")
        d.close()
        d.open("land" if m["cl"][2] else "keep")
        d.section("Diagramme de classes")
        d.p("Légende : <span class='lg old'>bleu</span> classe existante, <span class='lg new'>orange</span> classe "
            "nouvelle (« nouveau » signale aussi un attribut ou une valeur ajoutés), <span class='lg ext'>gris</span> "
            "classe appartenant à un autre module.")
        d.figure(m["cl"][0], m["cl"][1], size="full")
        if m["cl"][2]:
            d.ul([esc(x) for x in m["cl_notes"]], "notes")
            d.close()
        else:
            d.close()
            d.ul([esc(x) for x in m["cl_notes"]])
        d.open("land")
        d.section("Diagramme de séquence")
        d.p(f"Le diagramme de séquence suivant décrit le scénario « {esc(u['titre'])} » à travers les couches "
            "Angular, contrôleur REST, service et persistance.")
        d.figure(m["sq"][0], m["sq"][1])
        d.close()
        d.section("API REST du module")
        d.table(["Méthode", "Endpoint", "Description", "Rôles", "Statut"],
                [[f"<code>{esc(a)}</code>", f"<code>{esc(b)}</code>", esc(c), esc(r2),
                  '<span class="b-new">Nouveau</span>' if s == "N" else ('<span class="b-old">Existant</span>' if s == "E" else '<span class="b-old">Existant</span> <span class="b-new">Nouveau</span>')]
                 for a, b, c, r2, s in m["api"]],
                f"Endpoints REST du module {m['code']}", ["14%", "34%", "24%", "17%", "11%"], cls="api")
        d.section("Fichiers concernés")
        d.add('<div class="two"><div class="box"><h4>Backend — com.clinique.gestion</h4><ul>' +
              "".join(f"<li>{esc(x)}</li>" for x in m["back"]) +
              '</ul></div><div class="box"><h4>Frontend — src/app</h4><ul>' +
              "".join(f"<li>{esc(x)}</li>" for x in m["front"]) + "</ul></div></div>")
        d.section("Livrables et critères d'acceptation")
        d.ul([esc(x) for x in m["livrables"]], "check")

    # ---------------------------------------------------------------- Conclusion
    d.chapter("Conclusion générale", numbered=False)
    d.p("Ce rapport a posé les bases de l'évolution de MediCare. L'analyse a identifié neuf acteurs, "
        f"{sum(len(m['bf']) for m in MODULES)} besoins fonctionnels et {len(BNF)} besoins non fonctionnels. La conception UML "
        "— cas d'utilisation, classes et séquences, au niveau global puis par module — fixe un langage commun à "
        f"l'équipe. Le product backlog compte {n_us} user stories ({total_sp} story points), réparties en six sprints "
        "équilibrés, un par membre.")
    d.p("Les quatre modules existants seront consolidés et enrichis (disponibilités des médecins, ordonnances "
        "structurées, résultats par paramètre, facturation automatique), tandis que deux modules nouveaux apportent "
        "une réelle valeur ajoutée : la <b>pharmacie</b>, qui ferme le circuit du médicament, et l'<b>intelligence "
        "artificielle</b>, utilisée de manière sécurisée et responsable pour orienter les patients et assister les "
        "médecins et la direction.")
    d.p("La prochaine étape est la phase de développement : sprint 0 de préparation commune, puis réalisation des "
        "six sprints en parallèle et intégration. Parmi les perspectives figurent la téléconsultation, une "
        "application mobile, le paiement en ligne et le déploiement conteneurisé (Docker) de la plateforme.")

    # ---------------------------------------------------------------- Annexes
    d.chapter("Annexes", numbered=False, prefix="A")
    d.section("A. Légende des diagrammes")
    d.table(["Élément", "Signification"],
            [["<span class='lg old'>Fond bleu</span>", "Classe ou cas d'utilisation existant dans la version actuelle."],
             ["<span class='lg new'>Fond orange</span>", "Élément nouveau à réaliser ; « nouveau » signale aussi un attribut ou une valeur d'énumération ajoutés."],
             ["<span class='lg ext'>Fond gris</span>", "Classe appartenant à un autre module (« externe »)."],
             ["« include »", "Le cas d'utilisation de base inclut toujours le cas inclus."],
             ["« extend »", "Le cas d'utilisation étendu est optionnel et enrichit le cas de base."],
             ["Losange plein", "Composition : la partie n'existe pas sans le tout (ex. Facture ◆— LigneFacture)."]],
            "Légende des diagrammes UML", ["26%", "74%"])
    d.section("B. Glossaire")
    d.table(["Terme", "Définition"], [[f"<b>{esc(a)}</b>", esc(b)] for a, b in GLOSSAIRE], "Glossaire", ["16%", "84%"])

    return d


CSS = r"""
@page { size: A4; margin: 18mm 17mm 18mm 17mm; }
@page paysage { size: A4 landscape; margin: 14mm 14mm 16mm 14mm; }
:root { --pri:#1F5F7A; --pri2:#DCEBF3; --ink:#1d2731; --mut:#5b6b78; --new:#C46A00; --newbg:#FFF3DF; --oldbg:#E6F0F6; --line:#c9d6df; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Carlito', 'Liberation Sans', sans-serif; font-size: 11pt; line-height: 1.45; color: var(--ink); margin: 0; background: #fff; }
.mk { font-size: 1px; color: #fff; letter-spacing: 0; }
h1, h2, h3, h4 { font-family: 'Inter', 'Liberation Sans', sans-serif; color: var(--pri); }
h1.chap { break-before: page; font-size: 22pt; font-weight: 700; margin: 0 0 8mm; padding-bottom: 4mm; border-bottom: 2.5px solid var(--pri); line-height: 1.2; }
h1.chap .kicker { display: block; font-size: 10pt; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--new); margin-bottom: 2mm; }
h2 { font-size: 14pt; font-weight: 650; margin: 7mm 0 3mm; break-after: avoid; }
h2.lot { margin-top: 10mm; }
h3 { font-size: 11.5pt; font-weight: 650; margin: 5mm 0 1.5mm; color: #2c4a5a; break-after: avoid; }
h4 { font-size: 10pt; margin: 0 0 2mm; }
p { margin: 0 0 3mm; text-align: justify; }
p.lead { margin-bottom: 1mm; }
ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
li { margin-bottom: 1mm; }
code { font-family: 'DejaVu Sans Mono', monospace; font-size: 8.3pt; color: #234; background: #f1f5f8; padding: 0 2px; border-radius: 2px; }
ul.bf { list-style: none; padding-left: 0; }
ul.bf li { padding-left: 0; }
.rid { display: inline-block; min-width: 23mm; font-family: 'Inter', sans-serif; font-size: 8pt; font-weight: 600; color: var(--pri); background: var(--pri2); border-radius: 3px; padding: 0 4px; margin-right: 2mm; text-align: center; }
ul.check { list-style: none; padding-left: 0; }
ul.check li::before { content: "✓"; color: #2e7d4f; font-weight: 700; margin-right: 2.5mm; }
/* tables */
table.t { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 9.6pt; table-layout: fixed; }
table.t caption { caption-side: bottom; text-align: center; font-size: 9pt; color: var(--mut); padding-top: 2mm; }
table.t th { background: var(--pri); color: #fff; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 8.6pt; text-align: left; padding: 2mm 2.2mm; }
table.t td { border-bottom: 1px solid var(--line); padding: 1.8mm 2.2mm; vertical-align: top; overflow-wrap: anywhere; }
table.t tbody tr:nth-child(even) td { background: #f7fafc; }
table.t thead { display: table-header-group; }
table.t tr { break-inside: avoid; }
table.pb td:first-child, table.sb td:first-child { white-space: nowrap; }
table.pb tr td[colspan] { }
table.pb tbody tr:has(td:nth-child(2):empty) td { background: var(--pri2) !important; color: var(--pri); padding-top: 2.4mm; }
table.sb tbody tr:last-child td { background: var(--pri2) !important; }
table.api td { font-size: 9pt; }
table.api code { font-size: 7.6pt; background: none; padding: 0; }
table.ucd td:first-child { background: #f1f6f9 !important; }
table.ucd ol, table.ucd ul { margin: 0; }
.us { margin-bottom: 1mm; }
ul.tk { margin: 0; padding-left: 4.5mm; font-size: 8.9pt; color: #33434f; }
ul.tk li { margin: 0.4mm 0; }
.hh { color: var(--mut); font-size: 8pt; white-space: nowrap; }
.b-new, .b-old { display: inline-block; font-family: 'Inter', sans-serif; font-size: 7pt; font-weight: 600; border-radius: 3px; padding: 0.3mm 1.5mm; white-space: nowrap; }
.b-new { background: var(--newbg); color: var(--new); border: 1px solid #f0c98d; }
.b-old { background: var(--oldbg); color: var(--pri); border: 1px solid #b9d3e2; }
.p-h, .p-m, .p-b { font-weight: 700; font-size: 9pt; }
.p-h { color: #b3261e; } .p-m { color: #a76a00; } .p-b { color: #4a7a4a; }
.lg { display: inline-block; padding: 0 2mm; border-radius: 2px; font-size: 9pt; }
.lg.old { background: #F3F8FB; border: 1px solid #1F5F7A; }
.lg.new { background: #FFF6E6; border: 1px solid #C46A00; }
.lg.ext { background: #EEEEEE; border: 1px solid #888; }
/* figures */
figure.fig { margin: 3mm 0 6mm; text-align: center; break-inside: avoid; }
figure.fig img { max-width: 100%; max-height: 222mm; height: auto; }
figure.fig.mid img { max-width: 80%; max-height: 200mm; }
figcaption { font-size: 9pt; color: var(--mut); margin-top: 2mm; }
.land { page: paysage; }
.land h2 { margin-top: 0; }
.land figure.fig { margin: 0 0 2mm; }
.land figure.fig img { max-width: 100%; max-height: 134mm; }
.land:has(ul.notes) figure.fig img { max-height: 118mm; }
.land ul.notes { font-size: 9pt; margin: 0; columns: 2; column-gap: 8mm; }
.keep { break-inside: avoid; }
.keep figure.fig img { max-height: 200mm; }
/* blocks */
.meta { display: flex; flex-wrap: wrap; gap: 2mm 5mm; font-size: 9pt; background: #f4f8fb; border: 1px solid var(--line); border-radius: 4px; padding: 2.5mm 3.5mm; margin-bottom: 4mm; }
.meta b { color: var(--pri); font-family: 'Inter', sans-serif; font-size: 7.6pt; text-transform: uppercase; letter-spacing: .04em; margin-right: 1mm; }
.goal { border-left: 4px solid var(--pri); background: #f4f8fb; padding: 3mm 4mm; margin: 0 0 4mm; text-align: justify; }
.two { display: flex; gap: 4mm; margin-bottom: 4mm; break-inside: avoid; }
.two .box { flex: 1; border: 1px solid var(--line); border-radius: 4px; padding: 3mm 3.5mm; font-size: 9.6pt; }
.two .box ul { margin: 0; padding-left: 4.5mm; }
.box.old { background: #f4f8fb; }
.box.new { background: #fffaf1; border-color: #f0c98d; }
.box.new h4 { color: var(--new); }
/* toc */
.toc .tl { display: flex; align-items: baseline; gap: 2mm; margin: 0; }
.toc .tl.l1 { font-family: 'Inter', sans-serif; font-weight: 650; color: var(--pri); font-size: 10.5pt; margin-top: 3mm; }
.toc .tl.l2 { font-size: 10pt; padding-left: 7mm; margin-top: 0.6mm; }
.toc.lof .tl.l2 { padding-left: 0; font-size: 9.6pt; }
.toc .dots { flex: 1; border-bottom: 1px dotted #9aaab5; transform: translateY(-1mm); }
.toc .pn { min-width: 7mm; text-align: right; }
/* gantt */
table.gantt { width: 100%; border-collapse: collapse; font-size: 9.4pt; margin: 2mm 0 1mm; table-layout: fixed; }
table.gantt caption { display: none; }
table.gantt th { background: var(--pri); color: #fff; font-family: 'Inter', sans-serif; font-size: 8.4pt; padding: 1.6mm; }
table.gantt th:first-child { width: 46%; text-align: left; }
table.gantt td { border: 1px solid #fff; background: #f2f5f7; padding: 1.6mm 2mm; height: 6.5mm; }
table.gantt td.c0 { background: #7A97A8; } table.gantt td.c1 { background: #5E9BBB; }
table.gantt td.c2 { background: #E39A3B; } table.gantt td.c3 { background: #1F5F7A; } table.gantt td.c4 { background: #3D8A5F; }
p.cap { text-align: center; font-size: 9pt; color: var(--mut); margin-bottom: 5mm; }
"""


def body_html(d):
    return ("<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>MediCare — Rapport</title>"
            f"<style>{CSS}</style></head><body>{d.front_matter()}{''.join(d.parts)}</body></html>")


def cover_html():
    rows = []
    for m in MODULES:
        b = '<span class="b-new">Nouveau</span>' if m['statut'] == 'Nouveau' else '<span class="b-old">Existant</span>'
        rows.append(f"<tr><td class='mc'>{m['code']}</td><td>{esc(m['titre'])}</td><td>{b}</td><td>Sprint {m['sprint']}</td><td class='resp'></td></tr>")
    mods = "".join(rows)
    return f"""<!doctype html><html lang='fr'><head><meta charset='utf-8'><style>{CSS}
@page {{ size: A4; margin: 0; }}
.cv {{ height: 297mm; width: 210mm; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; }}
.band {{ background: linear-gradient(135deg, #1F5F7A 0%, #174a60 70%, #123b4d 100%); color: #fff; padding: 26mm 20mm 18mm; }}
.band .yr {{ font-size: 10pt; letter-spacing: .14em; text-transform: uppercase; opacity: .85; }}
.band h1 {{ font-size: 34pt; color: #fff; margin: 10mm 0 3mm; font-weight: 800; letter-spacing: -.01em; line-height: 1.05; }}
.band h2 {{ font-size: 14pt; color: #d8eaf3; font-weight: 500; margin: 0; line-height: 1.35; }}
.band .tag {{ display: inline-block; margin-top: 8mm; background: #C46A00; color: #fff; font-size: 9pt; font-weight: 600; padding: 1.5mm 3.5mm; border-radius: 3px; letter-spacing: .04em; }}
.body {{ padding: 12mm 20mm 0; }}
.body h3 {{ font-size: 10pt; letter-spacing: .1em; text-transform: uppercase; color: #1F5F7A; margin: 0 0 3mm; }}
table.mods {{ width: 100%; border-collapse: collapse; font-family: 'Carlito', sans-serif; font-size: 10.5pt; }}
table.mods th {{ text-align: left; font-family: 'Inter', sans-serif; font-size: 8pt; color: #5b6b78; text-transform: uppercase; letter-spacing: .06em; border-bottom: 2px solid #1F5F7A; padding: 1.5mm 2mm; }}
table.mods td {{ border-bottom: 1px solid #dfe7ec; padding: 2.4mm 2mm; }}
table.mods td.mc {{ font-family: 'Inter', sans-serif; font-weight: 700; color: #1F5F7A; width: 11mm; }}
table.mods td.resp {{ width: 52mm; border-bottom: 1px dotted #9aaab5; }}
.foot {{ position: absolute; left: 20mm; right: 20mm; bottom: 16mm; display: flex; justify-content: space-between; font-size: 10pt; color: #33434f; font-family: 'Carlito', sans-serif; }}
.foot div {{ line-height: 1.7; }}
.foot b {{ font-family: 'Inter', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: #1F5F7A; display: block; }}
</style></head><body><div class='cv'>
<div class='band'><div class='yr'>Projet d'équipe · Année universitaire 2026 – 2027</div>
<h1>MediCare</h1><h2>Plateforme intelligente de gestion d'une clinique médicale</h2>
<h2 style='margin-top:6mm;font-size:12pt;color:#bcd9e8'>Rapport d'analyse, de conception et de planification Scrum<br>Besoins · Cas d'utilisation · Diagrammes de classes et de séquence · Backlogs · 6 sprints</h2>
<span class='tag'>Spring Boot 3 · Angular 17 · MySQL · IA générative</span></div>
<div class='body'><h3>Équipe et répartition des modules</h3>
<table class='mods'><thead><tr><th>Mod.</th><th>Module</th><th>Statut</th><th>Sprint</th><th>Responsable</th></tr></thead><tbody>{mods}</tbody></table></div>
<div class='foot'><div><b>Encadré par</b>____________________________</div><div><b>Établissement</b>____________________________</div><div style='text-align:right'><b>Date</b>Octobre 2026</div></div>
</div></body></html>"""


RENDER_JS = r"""
const { chromium } = require('playwright');
(async () => {
  const [,, input, output, footer] = process.argv;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + input, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const opts = { path: output, preferCSSPageSize: true, printBackground: true };
  if (footer === '1') {
    opts.displayHeaderFooter = true;
    opts.headerTemplate = '<div></div>';
    opts.footerTemplate = `<div style="width:100%;font-family:Carlito,sans-serif;font-size:8px;color:#6b7b88;padding:0 15mm;display:flex;justify-content:space-between;">
      <span>MediCare — Rapport d'analyse, de conception et de planification</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  }
  await page.pdf(opts);
  await browser.close();
})();
"""


def render(html_path, pdf_path, footer):
    js = os.path.join(OUT, "render.js")
    with open(js, "w") as f:
        f.write(RENDER_JS)
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    subprocess.run(["node", js, html_path, pdf_path, "1" if footer else "0"], check=True, env=env)


def find_pages(pdf_path):
    txt = subprocess.run(["pdftotext", pdf_path, "-"], capture_output=True, text=True, check=True).stdout
    pages = {}
    for i, chunk in enumerate(txt.split("\f"), start=1):
        for k in re.findall(r"@@(K\d{3})@@", chunk.replace(" ", "")):
            pages.setdefault(k, i)
    return pages


def main():
    body_path = os.path.join(OUT, "body.html")
    pdf1 = os.path.join(OUT, "body.pdf")
    pages = {}
    for it in range(3):
        d = build_body(pages)
        with open(body_path, "w") as f:
            f.write(body_html(d))
        render(body_path, pdf1, True)
        newpages = find_pages(pdf1)
        missing = [k for _, _, k in d.toc if k not in newpages]
        print(f"pass {it+1}: {len(newpages)} marqueurs trouvés, manquants TOC: {missing[:5]}")
        if newpages == pages:
            break
        pages = newpages
    # rendu final sans marqueurs, puis vérification que chaque titre reste sur sa page
    html = body_html(d).replace("</style>", ".mk{display:none !important}</style>", 1)
    with open(body_path, "w") as f:
        f.write(html)
    final_body = os.path.join(OUT, "body_final.pdf")
    render(body_path, final_body, True)
    txt = subprocess.run(["pdftotext", final_body, "-"], capture_output=True, text=True, check=True).stdout.split("\f")
    norm = lambda x: re.sub(r"\s+", "", x)
    bad = []
    for lvl, title, k in d.toc:
        p = pages[k]
        probe = norm(title.split(" — ")[-1])[:25]
        if probe not in norm(txt[p - 1]):
            bad.append((title, p))
    print("titres déplacés:", bad[:5], len(bad))
    pdf1 = final_body
    cover = os.path.join(OUT, "cover.html")
    with open(cover, "w") as f:
        f.write(cover_html())
    render(cover, os.path.join(OUT, "cover.pdf"), False)
    from pypdf import PdfWriter, PdfReader
    w = PdfWriter()
    for p in PdfReader(os.path.join(OUT, "cover.pdf")).pages[:1]:
        w.add_page(p)
    for p in PdfReader(pdf1).pages:
        w.add_page(p)
    w.add_metadata({"/Title": "MediCare — Rapport d'analyse, de conception et de planification Scrum",
                    "/Subject": "Besoins, UML, backlogs et 6 sprints", "/Author": "Équipe MediCare"})
    final = os.path.join(ROOT, "Rapport_MediCare_6_modules.pdf")
    with open(final, "wb") as f:
        w.write(f)
    print("OK", final, len(w.pages), "pages")


if __name__ == "__main__":
    main()
