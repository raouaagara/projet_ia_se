# -*- coding: utf-8 -*-
"""Génère le journal et le catalogue des prompts IA de MediCare, par module.

Réutilise la mise en page et le moteur de rendu de build.py (mêmes prérequis).
    python3 build_prompts.py
"""
import os, re, subprocess
from html import escape as esc

import build as B
from data import MODULES, DEPENDANCES

FOOTER = "MediCare — Journal et catalogue des prompts IA"
FINAL = os.path.join(B.ROOT, "Prompts_MediCare_par_module.pdf")

# --------------------------------------------------------------------------- prompts réellement envoyés
# Copie fidèle des messages envoyés à l'assistant (fautes de frappe comprises).
JOURNAL = [
    {
        "titre": "Découpage du projet en six modules",
        "date": "12/10/2026",
        "texte": "i want to ask u if we can add 2more modules to this project bro because we are 6 personnes and i want divise all the project to 6 module chacun a son module so give what is the plan",
        "resultat": "Analyse du code existant (entités, contrôleurs, pages Angular) puis proposition d'un découpage en six modules : quatre modules existants regroupés (M1 à M4) et deux nouveaux modules (M5 IA & Aide à la décision, M6 Pharmacie & Stock), avec des règles de travail Git et un calendrier.",
        "livrable": "Plan de découpage (réponse dans la conversation)",
        "modules": "Tous (M1 à M6)",
    },
    {
        "titre": "Rapport d'analyse, de conception et de planification",
        "date": "12/10/2026",
        "texte": ("ok bro now i want u to give a rapport that contient this 6 modules Utilisateurs, Patients & Médecins\texisting\tLogin/register, JWT, roles, SecurityConfig, users, patients, doctors, profile pages\n"
                  "M2\tRendez-vous, Planning & Notifications\texisting\tAppointments (patient, secretary and doctor views), planning calendar, automatic reminders (RappelRdvService), the notification service and pages\n"
                  "M3\tConsultations, Ordonnances & Facturation\texisting\tConsultations, prescriptions, patient file and history, invoices and payments\n"
                  "M4\tExamens & Laboratoire\texisting\tLab test requests, the lab area (/labo), entering results, the patient’s lab results page\n"
                  "M5\tIA & Aide à la décision\t🆕 new\tTakes over the current chatbot and the statistics/dashboard, then adds new AI features (below)\n"
                  "M6\tPharmacie & Stock i want u to give les besoins fonctionnel et non fonctionnel diagramme de classe , use cas , backlog and then chaque module don't un sprint alone with there diagrams and there backlog let's do that all in pdf file and after we finish this i will tell u what we will do in the developpement"),
        "resultat": "Rapport PDF de 77 pages : besoins fonctionnels et non fonctionnels, diagramme de cas d'utilisation global, diagramme de classes global, product backlog (72 user stories), planification, puis un chapitre par sprint/module avec sprint backlog, cas d'utilisation, description textuelle, diagramme de classes, diagramme de séquence, API REST et livrables.",
        "livrable": "docs/rapport/Rapport_MediCare_6_modules.pdf",
        "modules": "Tous (M1 à M6)",
    },
    {
        "titre": "Présentation des prompts par module",
        "date": "12/10/2026",
        "texte": "ok bro now in this matiere we must affiche to the prof les prompts that give it to u so i want u to create for me a pdf file that conrient des prompt and divise that prompts with module so chaque module has his own prompt bro",
        "resultat": "Le présent document : journal des prompts envoyés et catalogue de prompts par module (conception, backend, frontend, tests) avec une fiche de suivi pour chaque responsable.",
        "livrable": "docs/rapport/Prompts_MediCare_par_module.pdf",
        "modules": "Tous (M1 à M6)",
    },
]

# --------------------------------------------------------------------------- données propres à chaque module
EXTRA = {
    "M1": dict(
        acteurs="Visiteur, Utilisateur authentifié, Administrateur, Secrétaire, Médecin, Patient",
        externes="aucune (M1 fournit les classes de référence Utilisateur, Patient et Medecin)",
        regles=["email unique et mot de passe haché avec BCrypt ;",
                "refuser la connexion d'un compte désactivé ;",
                "le changement de mot de passe exige l'ancien mot de passe ;",
                "numéro de dossier patient généré automatiquement ;",
                "ajouter la valeur PHARMACIEN à l'énumération Role et la redirection vers /pharmacie ;",
                "enregistrer une entrée JournalAudit à chaque création, modification ou suppression sensible."],
        ecrans=["login et register : validations des champs et redirection selon le rôle (y compris /pharmacie) ;",
                "utilisateurs : liste paginée filtrable par rôle, création / édition, attribution du rôle, activation / désactivation ;",
                "medecins : liste, ajout, édition, disponibilité ;",
                "patients : formulaire complet (antécédents, allergies, groupe sanguin) et recherche avec temporisation (debounce) ;",
                "profil : édition des informations et boîte de dialogue « Changer le mot de passe » ;",
                "audit (nouveau) : journal filtrable par date, utilisateur et action."],
        service="core/utilisateur.service.ts",
        roles="ADMIN pour l'administration, tous les rôles pour le profil",
        tests=["inscription avec un email déjà utilisé", "connexion d'un compte désactivé",
               "changement de mot de passe avec un ancien mot de passe erroné", "recherche de patient par nom et par n° de dossier",
               "création d'une entrée d'audit lors d'une suppression"],
    ),
    "M2": dict(
        acteurs="Patient, Secrétaire, Médecin, Administrateur, Utilisateur authentifié, Système (planificateur)",
        externes="Patient, Medecin, Utilisateur (module M1)",
        regles=["créneaux libres = plages horaires du médecin − rendez-vous existants − indisponibilités ;",
                "interdire la double réservation : vérification dans le service, contrainte d'unicité (medecin_id, date_heure) et réponse 409 ;",
                "annulation ou report par le patient autorisés jusqu'à 24 h avant le rendez-vous ;",
                "rappel unique 24 h avant : ajouter rappelEnvoye à RendezVous et ne traiter que rappelEnvoye = false (RappelRdvService renvoie aujourd'hui le même rappel à chaque exécution horaire) ;",
                "notifier patient et médecin à chaque changement de statut ; statut ABSENT pour les absences ;",
                "NotificationService.notifier(utilisateur, type, titre, message, referenceType, referenceId) est utilisé par tous les modules : ne pas changer sa signature."],
        ecrans=["prise de rendez-vous patient : médecin → date → créneaux libres → motif → confirmation ;",
                "mes rendez-vous : onglets « À venir » / « Passés », annulation et report ;",
                "gestion des rendez-vous (secrétaire) : création, édition, suppression, filtres par médecin, date et statut ;",
                "planning : vues jour / semaine / mois avec code couleur par statut ;",
                "disponibilités (nouveau) : plages horaires et indisponibilités du médecin ;",
                "notifications : liste, « marquer lu », « tout lire », suppression, badge du nombre de non lues (toutes les 15 s)."],
        service="core/rendez-vous.service.ts et core/notification.service.ts",
        roles="PATIENT, SECRETAIRE, MEDECIN, ADMIN",
        tests=["créneaux libres excluant les rendez-vous et les indisponibilités", "double réservation refusée (409)",
               "annulation à moins de 24 h refusée", "rappel envoyé une seule fois par rendez-vous",
               "notifications envoyées au patient et au médecin"],
    ),
    "M3": dict(
        acteurs="Médecin, Secrétaire, Administrateur, Patient",
        externes="Patient, Medecin (M1), RendezVous (M2), Medicament (M6)",
        regles=["la clôture d'une consultation passe le rendez-vous à TERMINE, génère une facture EN_ATTENTE au tarif de l'acte (ActeMedical) et notifie le patient (FACTURE_GENEREE) ;",
                "ordonnance structurée en lignes : LigneOrdonnance(medicament, posologie, dureeJours, quantite) remplace le champ texte medicaments (reprendre les anciennes données) ;",
                "paiements partiels : enregistrer chaque Paiement, mettre à jour le statut (PARTIELLEMENT_PAYE puis PAYE) et calculer le reste à payer ;",
                "numérotation automatique des factures FAC-AAAA-0001 ;",
                "export PDF des ordonnances et des factures (OpenPDF) ;",
                "exposer FactureService.ajouterLignes(factureId, lignes) pour le module M6."],
        ecrans=["consultation : formulaire lié au rendez-vous, affichage du dossier médical, bouton « Clôturer » ;",
                "ordonnance : lignes dynamiques avec recherche de médicament (API M6) et indication de disponibilité ;",
                "factures et facturation : relier FacturationComponent et OrdonnancesComponent au routage (ils existent mais ne sont pas routés) ;",
                "paiement : mode, montant, référence ;",
                "actes (nouveau) : catalogue des actes médicaux et tarifs ;",
                "espace patient : historique, dossier, mes factures avec téléchargement PDF."],
        service="core/consultation.service.ts et core/facture.service.ts",
        roles="MEDECIN, SECRETAIRE, ADMIN, PATIENT",
        tests=["la clôture génère la facture au bon tarif", "un paiement partiel puis total met à jour le statut",
               "calcul du reste à payer", "ordonnance enregistrée avec ses lignes",
               "un patient ne peut pas lire les factures d'un autre patient"],
    ),
    "M4": dict(
        acteurs="Médecin, Administrateur, Laborantin, Patient",
        externes="Patient, Medecin, Utilisateur (M1), Consultation (M3)",
        regles=["catalogue TypeExamen avec ses ParametreExamen (unité, valeurMin, valeurMax) ;",
                "saisie des résultats par paramètre (ResultatParametre) et calcul automatique de horsNorme ;",
                "transitions autorisées : DEMANDE → EN_COURS → RESULTAT_DISPONIBLE ; annulation uniquement au statut DEMANDE ;",
                "téléversement des comptes rendus : PDF, JPG ou PNG, 5 Mo maximum, stockage hors du dossier public, téléchargement contrôlé par rôle ;",
                "à la publication : notifier le patient et le médecin, et alerter le médecin si une valeur est hors norme ;",
                "enregistrer le laborantin qui a traité l'examen."],
        ecrans=["prescription : type d'examen du catalogue, case « urgent », description ;",
                "examens à traiter (laboratoire) : filtres par statut et urgence, tri ;",
                "saisie des résultats : formulaire généré à partir des paramètres du type, valeurs hors norme surlignées, téléversement ;",
                "mes examens (patient) : liste, détail, téléchargement ;",
                "évolution d'un paramètre : graphique (Chart.js) ;",
                "types d'examens (nouveau, administrateur) et supervision du laboratoire."],
        service="core/examen.service.ts",
        roles="MEDECIN, LABO, ADMIN, PATIENT",
        tests=["transition de statut interdite refusée", "calcul de horsNorme aux bornes",
               "fichier de plus de 5 Mo refusé", "notifications envoyées à la publication",
               "évolution d'un paramètre triée par date"],
    ),
    "M5": dict(
        acteurs="Utilisateur authentifié, Patient, Médecin, Administrateur, API IA Groq (acteur secondaire)",
        externes="Utilisateur, Patient, Medecin (M1), ExamenLaboratoire (M4)",
        regles=["tous les appels à l'API Groq passent par le serveur (GroqClient) ; la clé est lue dans une variable d'environnement et n'apparaît jamais dans le code Angular ;",
                "délai maximal de 10 s et message de repli en cas d'erreur : l'IA ne bloque jamais un processus métier ;",
                "pseudonymisation : n'envoyer que l'âge, le sexe et les antécédents, jamais le nom ni le numéro de dossier ;",
                "demander une réponse JSON structurée (spécialité, niveau d'urgence, justification) et la valider avant usage ;",
                "si le niveau est URGENCE_VITALE : afficher une alerte d'orientation vers les urgences et ne proposer aucun rendez-vous ;",
                "journaliser chaque appel (modèle, utilisateur, durée) ; les analyses (AnalyseIA) doivent être validées par le médecin ;",
                "prévisions calculées à partir de l'historique des rendez-vous (moyennes mobiles, taux d'absence par créneau à partir du statut ABSENT)."],
        ecrans=["chatbot : supprimer l'appel direct à Groq, passer par /api/chatbot, panneau d'historique des conversations ;",
                "pré-triage (nouveau, patient) : saisie des symptômes → spécialité, urgence, médecins suggérés, bouton « Prendre RDV » qui préremplit l'écran du module M2 ;",
                "panneau « Résumé IA » dans l'écran de consultation et aide à l'interprétation dans le détail d'un examen, avec bouton « Valider » ;",
                "tableau de bord adapté au rôle, statistiques détaillées, prévisions (graphiques) et export PDF / Excel ;",
                "bandeau « Ces suggestions ne remplacent pas un avis médical » sur toutes les réponses IA."],
        service="core/ia.service.ts",
        roles="tous les rôles (chatbot), PATIENT (triage), MEDECIN (résumé, interprétation), ADMIN (statistiques, prévisions)",
        tests=["client Groq simulé : réponse valide", "réponse JSON invalide → repli",
               "délai dépassé → repli", "URGENCE_VITALE → aucun rendez-vous proposé",
               "aucun nom ni n° de dossier dans le prompt envoyé", "chaque appel est journalisé"],
    ),
    "M6": dict(
        acteurs="Pharmacien, Administrateur, Médecin, Patient, Système (planificateur)",
        externes="Ordonnance, LigneOrdonnance, Facture (M3), Utilisateur (M1)",
        regles=["le stock d'un médicament est la somme des quantiteRestante de ses lots non périmés (pas de champ dupliqué) ;",
                "délivrance selon la règle FEFO (premier périmé, premier sorti), dans une transaction unique : tout ou rien ;",
                "délivrance PARTIELLE si le stock est insuffisant, le reste à servir est conservé ;",
                "chaque opération (réception, délivrance, ajustement, péremption) crée un MouvementStock ;",
                "tâche @Scheduled quotidienne : alerte ALERTE_STOCK sous le seuil et pour les lots périmant dans moins de 30 jours ;",
                "facturation des médicaments délivrés via FactureService.ajouterLignes (module M3) ;",
                "espace /pharmacie réservé aux rôles PHARMACIEN et ADMIN."],
        ecrans=["pharmacie-layout (nouveau, sur le modèle de labo-layout) avec menu et badge d'alertes ;",
                "médicaments : catalogue avec recherche ; fournisseurs ;",
                "stock : quantités par médicament et par lot, indicateurs « sous le seuil » et « péremption proche » ;",
                "réceptions : saisie d'un lot (quantité, date de péremption, fournisseur) ;",
                "ordonnances à délivrer et écran de délivrance (quantités, lots prélevés, bon imprimable) ;",
                "mouvements et alertes ; statut de délivrance visible dans l'historique du patient."],
        service="core/pharmacie.service.ts",
        roles="PHARMACIEN, ADMIN (et MEDECIN en lecture pour la disponibilité)",
        tests=["FEFO prélève d'abord le lot le plus proche de la péremption", "les lots périmés sont ignorés",
               "délivrance partielle si stock insuffisant", "annulation complète (rollback) en cas d'erreur",
               "alerte générée sous le seuil", "un MouvementStock est créé à chaque opération"],
    ),
}

CONTEXTE = ("Projet MediCare : plateforme web de gestion d'une clinique médicale. Backend Spring Boot 3.2.5 / Java 17 "
            "(package com.clinique.gestion : entity, repository, service, controller, dto, security, config), Spring Data JPA, "
            "MySQL 8, Spring Security avec JWT et @PreAuthorize. Frontend Angular 17 en composants standalone "
            "(src/app/pages, src/app/layouts, src/app/core). Rôles : ADMIN, MEDECIN, SECRETAIRE, PATIENT, LABO, PHARMACIEN.")


def contrats(code):
    out = []
    for a, b, c, r in DEPENDANCES:
        if a == code:
            out.append(f"{code} fournit à {b} : {c}")
        elif b == code or (b == "Tous" and a != code):
            out.append(f"{code} utilise {c} (fourni par {a})")
    return out


def lst(items, bullet="- "):
    return "\n".join(f"{bullet}{x}" for x in items)


def prompts_for(m):
    x = EXTRA[m["code"]]
    code, titre, n = m["code"], m["titre"], m["sprint"]
    us = [f"US-{u[0]} : en tant {'qu' + chr(39) if u[1][0].lower() in 'aeiouéh' else 'que '}{u[1]}, je veux {u[2]} afin de {u[3]}." for u in m["us"]]
    api = [f"{a} {b} — {c} ({r})" for a, b, c, r, s in m["api"]]
    ent = m["back"][0].replace("entity : ", "")
    ctr = contrats(code)
    ucd = m["ucd"]["titre"]

    p1 = f"""Tu es analyste-concepteur UML et Scrum Master.
Contexte : {CONTEXTE}

Je suis responsable du module {code} « {titre} », qui correspond au sprint {n} (3 semaines).
Objectif du module : {m['objectif']}
Ce qui existe déjà dans le code :
{lst(m['existant'])}
Ce qu'il faut ajouter :
{lst(m['nouveau'])}

Produis en français, pour ce module uniquement :
1. Les besoins fonctionnels (formulés « Le système doit… », identifiants BF-{code}-01, BF-{code}-02…) et les besoins non fonctionnels qui le concernent (sécurité, performance, ergonomie, fiabilité).
2. Le diagramme de cas d'utilisation en PlantUML. Acteurs : {x['acteurs']}. Utilise les relations « include » et « extend » ; marque les cas nouveaux avec le stéréotype <<nouveau>>.
3. La description textuelle du cas « {ucd} » : acteurs, pré-conditions, post-conditions, scénario nominal numéroté, scénarios alternatifs.
4. Le diagramme de classes en PlantUML (attributs typés Java, multiplicités, énumérations). Les classes d'autres modules apparaissent avec le stéréotype <<externe>> : {x['externes']}.
5. Le diagramme de séquence PlantUML du scénario « {ucd} » à travers les couches Angular → Controller → Service → Repository.
6. Le sprint backlog sous forme de tableau : user stories « En tant que…, je veux… afin de… », priorité (Haute / Moyenne / Basse), story points (1, 2, 3, 5, 8) et tâches techniques estimées en heures.

Contraintes : reste dans le périmètre du module et respecte les contrats avec les autres modules :
{lst(ctr)}"""

    p2 = f"""Tu es développeur backend Java senior.
Contexte : {CONTEXTE}

Je développe la partie backend du module {code} « {titre} ».
Fichiers concernés :
{lst(m['back'])}

Travail demandé :
1. Entités JPA : {ent}. Ajoute les nouveaux attributs et associations du diagramme de classes du module.
2. Repositories Spring Data avec les requêtes nécessaires.
3. Services métier, avec @Transactional dès que plusieurs entités sont modifiées. Règles métier à respecter :
{lst(x['regles'])}
4. Contrôleurs REST exposant exactement ces endpoints, sécurisés avec @PreAuthorize :
{lst(api)}
5. DTO d'entrée et de sortie (ne jamais renvoyer directement une entité) avec validation jakarta.validation.
6. Erreurs gérées par GlobalExceptionHandler : 400 (validation), 403, 404, 409 (conflit).

Contraintes : ne modifie pas les fichiers des autres modules (demande-moi si un contrat doit évoluer), utilise NotificationService.notifier(...) pour les notifications, aucun secret dans le code, endpoints visibles dans Swagger. Donne le code complet de chaque fichier avec son chemin."""

    p3 = f"""Tu es développeur frontend Angular 17 (composants standalone, formulaires réactifs, HttpClient, RxJS).
Contexte : {CONTEXTE} L'intercepteur authInterceptor ajoute le jeton JWT ; authGuard et roleGuard protègent les routes.

Je développe l'interface du module {code} « {titre} ».
Fichiers concernés :
{lst(m['front'])}

Travail demandé :
1. Crée {x['service']} avec une méthode typée par endpoint du module :
{lst(api)}
2. Crée ou mets à jour les écrans suivants :
{lst(x['ecrans'])}
3. Déclare les routes du module dans app.routes.ts (uniquement le bloc de ce module), protégées par roleGuard pour les rôles : {x['roles']}.
4. Ajoute les entrées de menu dans le ou les layouts concernés.

Exigences d'interface : en français, responsive (mobile, tablette, ordinateur), indicateurs de chargement, messages d'erreur clairs (403, 404, 409), confirmation avant suppression, badges de statut colorés, champs avec libellés (accessibilité). Donne le code complet (TypeScript, HTML, CSS) de chaque composant."""

    p4 = f"""Tu es ingénieur qualité logiciel.
Contexte : {CONTEXTE} Tests backend avec JUnit 5, Mockito et MockMvc.

Pour le module {code} « {titre} », écris :
1. Les tests unitaires des services du module (Mockito), cas nominaux et cas d'erreur, en particulier :
{lst(x['tests'])}
2. Les tests d'intégration des endpoints (MockMvc) qui vérifient la sécurité par rôle : 401 sans jeton, 403 avec un rôle non autorisé, 200 / 201 avec le bon rôle.
3. Une méthode d'initialisation des données de démonstration du module à ajouter au DataSeeder, sans dupliquer les données existantes.
4. Le scénario pas à pas de la démonstration de fin de sprint : {m['livrables'][0]}
5. La checklist de la définition de « Terminé » appliquée à ce module (compilation, sécurité par rôle, Swagger, page accessible depuis le menu, données de démo, tests verts, revue de code, aucun secret)."""

    return [
        ("P1", "Analyse et conception", "Conception — produit les besoins, les diagrammes UML et le sprint backlog du module.", p1,
         "Besoins BF/BNF, diagrammes de cas d'utilisation, de classes et de séquence (PlantUML), description textuelle et sprint backlog."),
        ("P2", "Développement backend", "Développement — entités, services, contrôleurs REST et sécurité.", p2,
         "Code Spring Boot complet du module, prêt à être relu, testé puis intégré par pull request."),
        ("P3", "Développement frontend", "Développement — services Angular, écrans, routes et menus.", p3,
         "Composants Angular du module, service HTTP, routes protégées et entrées de menu."),
        ("P4", "Tests et démonstration", "Validation — tests, données de démo et préparation de la sprint review.", p4,
         "Tests unitaires et d'intégration, données de démonstration, scénario de démo et checklist « Terminé »."),
    ], us


class PDoc(B.Doc):
    def front_matter(self):
        toc = ['<h1 class="chap plain">Sommaire</h1><div class="toc">']
        for lvl, title, k in self.toc:
            toc.append(f'<div class="tl l{lvl}"><span class="tt">{esc(title)}</span><span class="dots"></span><span class="pn">{self.pg(k)}</span></div>')
        toc.append("</div>")
        return "".join(toc)

    def prompt(self, pid, titre, phase, texte, attendu):
        self.add(f'<div class="pcard"><div class="phead"><span class="pid">{esc(pid)}</span><span class="pt">{esc(titre)}</span></div>'
                 f'<div class="pphase">{esc(phase)}</div><div class="pbody">{esc(texte)}</div>'
                 f'<div class="pfoot"><b>Résultat attendu :</b> {esc(attendu)}</div></div>')


EXTRA_CSS = r"""
.pcard { border: 1px solid #b9d3e2; border-radius: 5px; margin: 2mm 0 6mm; overflow: hidden; }
.phead { background: #1F5F7A; color: #fff; padding: 2mm 3.5mm; display: flex; gap: 3mm; align-items: baseline; break-after: avoid; }
.phead .pid { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 9pt; background: #C46A00; border-radius: 3px; padding: 0.3mm 2mm; }
.phead .pt { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 10.5pt; }
.pphase { background: #DCEBF3; color: #1F5F7A; font-size: 9pt; padding: 1.2mm 3.5mm; break-after: avoid; }
.pbody { white-space: pre-wrap; font-family: 'Carlito', sans-serif; font-size: 9.8pt; line-height: 1.42; padding: 3mm 4mm; background: #fbfcfd; border-left: 3px solid #1F5F7A; margin: 2mm 3mm; }
.pfoot { font-size: 9.2pt; padding: 1.5mm 3.5mm 2.5mm; color: #33434f; }
.pfoot b { color: #1F5F7A; }
.real .pbody { border-left-color: #C46A00; background: #fffaf1; }
.meta2 { display: grid; grid-template-columns: 30mm 1fr; gap: 1mm 3mm; font-size: 9.6pt; margin-bottom: 4mm; }
.meta2 b { color: #1F5F7A; font-family: 'Inter', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .04em; padding-top: .6mm; }
table.log td { height: 11mm; }
.note { border-left: 4px solid #C46A00; background: #fffaf1; padding: 3mm 4mm; margin: 0 0 4mm; text-align: justify; font-size: 10.2pt; }
"""


def build_body(pages):
    d = PDoc(pages)
    d.chapter("Introduction", numbered=False)
    d.p("Ce document rassemble les <b>prompts</b> (instructions données à l'assistant d'intelligence artificielle "
        "Claude, d'Anthropic, utilisé via Claude Code) dans le cadre du projet MediCare. Il a deux objectifs : "
        "rendre l'usage de l'IA <b>transparent</b> pour l'enseignant, et fournir à chacun des six membres de "
        "l'équipe les prompts de <b>son module</b>.")
    d.add('<div class="note"><b>Organisation du document.</b> Le chapitre 2 reproduit <b>à l\'identique</b> les '
          'prompts réellement envoyés pendant la phase d\'analyse et de conception, avec le résultat obtenu. Les '
          'chapitres 3 à 8 présentent, pour chaque module, quatre prompts prêts à l\'emploi (conception, backend, '
          'frontend, tests) que le responsable du module utilise pour son sprint, ainsi qu\'une fiche de suivi où il '
          'note la date et le résultat de chaque utilisation.</div>')
    d.table(["Module", "Intitulé", "Sprint", "Responsable", "Prompts"],
            [[f"<b>{m['code']}</b>", esc(m["titre"]), f"Sprint {m['sprint']}", "____________", f"{m['code']}-P1 à {m['code']}-P4"] for m in MODULES],
            "Répartition des prompts par module", ["11%", "38%", "13%", "22%", "16%"])

    d.chapter("Méthode de rédaction des prompts")
    d.p("Chaque prompt suit la même structure, afin d'obtenir des réponses précises, cohérentes entre les modules "
        "et vérifiables :")
    d.table(["Élément", "Rôle dans le prompt", "Exemple"],
            [["<b>Rôle</b>", "Fixe l'expertise attendue de l'assistant.", "« Tu es développeur backend Java senior. »"],
             ["<b>Contexte</b>", "Décrit le projet, la pile technique et l'existant.", "Spring Boot 3.2, Angular 17, MySQL 8, JWT, rôles."],
             ["<b>Tâche</b>", "Liste numérotée de ce qu'il faut produire.", "Entités, services, contrôleurs, DTO…"],
             ["<b>Contraintes</b>", "Limites de périmètre, règles métier, sécurité.", "Ne pas modifier les autres modules, aucun secret."],
             ["<b>Format de sortie</b>", "Forme exacte du résultat attendu.", "PlantUML, tableau, code complet avec chemins."]],
            "Structure d'un prompt", ["18%", "42%", "40%"])
    d.sub("Bonnes pratiques adoptées par l'équipe")
    d.ul(["Un prompt = un module et une phase : on évite les demandes trop larges.",
          "Le contexte technique est répété dans chaque prompt pour qu'il soit utilisable seul.",
          "Les contrats entre modules (méthodes et endpoints partagés) sont rappelés explicitement.",
          "Le résultat est toujours relu, compilé et testé par le responsable avant d'être intégré : l'IA propose, l'équipe valide.",
          "Aucune donnée personnelle réelle ni aucun secret (mot de passe, clé d'API) n'est inclus dans un prompt.",
          "Chaque utilisation est notée dans la fiche de suivi du module (date, prompt, résultat, corrections apportées)."])

    d.chapter("Journal des prompts envoyés")
    d.p("Les prompts ci-dessous sont reproduits <b>tels qu'ils ont été envoyés</b>, sans correction, dans l'ordre "
        "chronologique. Ils couvrent la phase d'analyse et de conception commune aux six modules.")
    for i, j in enumerate(JOURNAL, start=1):
        d.section(f"Prompt {i} — {j['titre']}")
        d.add(f'<div class="meta2"><b>Date</b><span>{j["date"]}</span><b>Modules</b><span>{esc(j["modules"])}</span>'
              f'<b>Livrable</b><span><code>{esc(j["livrable"])}</code></span></div>')
        d.add(f'<div class="pcard real"><div class="phead"><span class="pid">#{i}</span><span class="pt">Texte exact du prompt</span></div>'
              f'<div class="pbody">{esc(j["texte"])}</div>'
              f'<div class="pfoot"><b>Résultat obtenu :</b> {esc(j["resultat"])}</div></div>')

    for m in MODULES:
        ps, us = prompts_for(m)
        d.chapter(f"Module {m['code']} — {m['titre']}", kicker=f"Chapitre {d.ch + 1} · Sprint {m['sprint']}")
        d.section("Présentation du module")
        d.add(f'<div class="meta2"><b>Sprint</b><span>Sprint {m["sprint"]} — 3 semaines</span>'
              f'<b>Statut</b><span>{esc(m["statut"])}</span><b>Responsable</b><span>____________________</span>'
              f'<b>Objectif</b><span>{esc(m["objectif"])}</span></div>')
        d.sub("User stories couvertes par les prompts")
        d.ul([esc(u) for u in us], "tk")
        for pid, titre, phase, texte, attendu in ps:
            d.section(f"Prompt {m['code']}-{pid} — {titre}")
            d.prompt(f"{m['code']}-{pid}", titre, phase, texte, attendu)
        d.section("Fiche de suivi des prompts")
        d.p("À remplir par le responsable du module à chaque utilisation d'un prompt.")
        d.table(["Date", "Prompt", "Résultat obtenu", "Corrections apportées par l'équipe"],
                [["", f"{m['code']}-{p}", "", ""] for p in ("P1", "P2", "P3", "P4")] + [["", "", "", ""]] * 2,
                f"Fiche de suivi — module {m['code']}", ["14%", "14%", "36%", "36%"], cls="log")
    return d


def cover_html():
    rows = "".join(
        f"<tr><td class='mc'>{m['code']}</td><td>{esc(m['titre'])}</td><td>{m['code']}-P1 → P4</td><td class='resp'></td></tr>"
        for m in MODULES)
    html = B.cover_html()
    html = html.replace("<h2 style='margin-top:6mm;font-size:12pt;color:#bcd9e8'>Rapport d'analyse, de conception et de planification Scrum<br>Besoins · Cas d'utilisation · Diagrammes de classes et de séquence · Backlogs · 6 sprints</h2>",
                        "<h2 style='margin-top:6mm;font-size:12pt;color:#bcd9e8'>Journal et catalogue des prompts IA<br>Prompts envoyés · Prompts par module · Fiches de suivi</h2>")
    html = html.replace("Spring Boot 3 · Angular 17 · MySQL · IA générative", "Assistant IA : Claude (Anthropic) · Claude Code")
    html = re.sub(r"<thead><tr><th>Mod\.</th>.*?</tbody>",
                  f"<thead><tr><th>Mod.</th><th>Module</th><th>Prompts</th><th>Responsable</th></tr></thead><tbody>{rows}</tbody>",
                  html, flags=re.S)
    return html


def render(html_path, pdf_path, footer):
    js = os.path.join(B.OUT, "render_prompts.js")
    with open(js, "w") as f:
        f.write(B.RENDER_JS.replace("MediCare — Rapport d'analyse, de conception et de planification", FOOTER))
    env = dict(os.environ)
    env["NODE_PATH"] = subprocess.check_output(["npm", "root", "-g"], text=True).strip()
    subprocess.run(["node", js, html_path, pdf_path, "1" if footer else "0"], check=True, env=env)


def body_html(d, hide_markers=False):
    css = B.CSS + EXTRA_CSS + (".mk{display:none !important}" if hide_markers else "")
    return ("<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>MediCare — Prompts</title>"
            f"<style>{css}</style></head><body>{d.front_matter()}{''.join(d.parts)}</body></html>")


def main():
    os.makedirs(B.OUT, exist_ok=True)
    body_path = os.path.join(B.OUT, "prompts_body.html")
    pdf1 = os.path.join(B.OUT, "prompts_body.pdf")
    pages = {}
    for it in range(3):
        d = build_body(pages)
        with open(body_path, "w") as f:
            f.write(body_html(d))
        render(body_path, pdf1, True)
        newpages = B.find_pages(pdf1)
        print(f"pass {it+1}: {len(newpages)} marqueurs")
        if newpages == pages:
            break
        pages = newpages
    with open(body_path, "w") as f:
        f.write(body_html(d, hide_markers=True))
    final_body = os.path.join(B.OUT, "prompts_body_final.pdf")
    render(body_path, final_body, True)
    txt = subprocess.run(["pdftotext", final_body, "-"], capture_output=True, text=True, check=True).stdout.split("\f")
    norm = lambda s: re.sub(r"\s+", "", s)
    bad = [(t, pages[k]) for _, t, k in d.toc if norm(t.split(" — ")[-1])[:25] not in norm(txt[pages[k] - 1])]
    print("titres déplacés:", bad[:5], len(bad))
    cover = os.path.join(B.OUT, "prompts_cover.html")
    with open(cover, "w") as f:
        f.write(cover_html())
    render(cover, os.path.join(B.OUT, "prompts_cover.pdf"), False)
    from pypdf import PdfWriter, PdfReader
    w = PdfWriter()
    w.add_page(PdfReader(os.path.join(B.OUT, "prompts_cover.pdf")).pages[0])
    for p in PdfReader(final_body).pages:
        w.add_page(p)
    w.add_metadata({"/Title": "MediCare — Journal et catalogue des prompts IA", "/Author": "Équipe MediCare"})
    with open(FINAL, "wb") as f:
        w.write(f)
    print("OK", FINAL, len(w.pages), "pages")


if __name__ == "__main__":
    main()
