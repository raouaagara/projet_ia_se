# MediCare — Plateforme de gestion clinique

Application full-stack de gestion d'une clinique médicale, organisée en six modules.

**Backend** : Spring Boot 3.2 · Java 17 · Spring Security (JWT) · JPA/Hibernate
**Frontend** : Angular 17 (composants standalone)
**Base de données** : MySQL 8 (compatible MariaDB 10.6+)

---

## Démarrage rapide

### Prérequis
- Java 17+ et Maven 3.8+
- Node.js 18+ et npm
- MySQL 8+ (la base `clinique_db` est créée automatiquement)

### Backend
```bash
cd backend
mvn spring-boot:run
# API         : http://localhost:8081/api
# Swagger UI  : http://localhost:8081/swagger-ui.html
```

### Frontend
```bash
cd frontend
npm install
npm start          # équivalent de ng serve
# Application : http://localhost:4200
```

Au premier démarrage, le backend crée le schéma et charge un jeu de données de démonstration
(patients, médecins, rendez-vous, examens, catalogue de médicaments, lots et fournisseurs).
Les icônes (Font Awesome) sont intégrées au build : l'application fonctionne sans accès à un CDN.

---

## Configuration

Toute la configuration sensible passe par des variables d'environnement ; les valeurs par défaut
conviennent au développement local.

| Variable | Rôle | Valeur par défaut |
|----------|------|-------------------|
| `DB_URL` | URL JDBC | `jdbc:mysql://localhost:3306/clinique_db?createDatabaseIfNotExist=true…` |
| `DB_USERNAME` / `DB_PASSWORD` | Identifiants de la base | `root` / *(vide)* |
| `APP_JWT_SECRET` | Secret de signature des jetons (≥ 32 caractères) | secret de développement — **à remplacer en production** |
| `APP_CORS_ORIGINS` | Origines autorisées | `http://localhost:4200` |
| `GROQ_API_KEY` | Clé de l'API Groq pour les fonctions IA | *(vide)* |
| `GROQ_MODEL` | Modèle utilisé | `qwen/qwen3.8-27b` |

Sans `GROQ_API_KEY`, toutes les fonctions IA restent disponibles grâce au moteur de règles local
(voir module M5). La clé n'est jamais transmise au navigateur : seul le backend appelle le modèle.

Exemple :
```bash
export APP_JWT_SECRET="une-longue-phrase-secrete-de-plus-de-32-caracteres"
export GROQ_API_KEY="gsk_..."
mvn spring-boot:run
```

---

## Comptes de démonstration

Mot de passe pour tous : **`password`**

| Rôle | Email | Espace |
|------|-------|--------|
| Administrateur | admin@clinique.local | `/back` |
| Médecin | dr.martin@clinique.local | `/back` |
| Secrétaire | secretaire@clinique.local | `/secretaire` |
| Patient | patient.dupont@clinique.local | `/front` |
| Laboratoire | labo@clinique.local | `/labo` |
| Pharmacien | pharmacien@clinique.local | `/pharmacie` |

---

## Les six modules

| Module | Périmètre | Espaces concernés |
|--------|-----------|-------------------|
| **M1 — Utilisateurs & Sécurité** | Authentification JWT, rôles, comptes, profils | tous |
| **M2 — Rendez-vous & Planning** | Prise de RDV, plannings médecins, rappels automatiques | `/front`, `/back`, `/secretaire` |
| **M3 — Dossier médical** | Patients, consultations, ordonnances structurées, examens de laboratoire | `/back`, `/labo`, `/front` |
| **M4 — Facturation & Statistiques** | Factures, paiements, tableaux de bord | `/back`, `/secretaire`, `/front` |
| **M5 — IA & Aide à la décision** | Pré-diagnostic, résumé de dossier, aide à l'interprétation, prévisions, assistant | `/front`, `/back` |
| **M6 — Pharmacie & Stock** | Catalogue, lots, réceptions, délivrance FEFO, alertes de stock | `/pharmacie`, `/back` |

Les modules sont reliés entre eux :

```
Médecin ── ordonnance structurée (médicaments du catalogue) ──► Pharmacie
                                                               │ délivrance FEFO (lots)
                                                               ├─► mouvement de stock
                                                               ├─► facture du patient (M4)
                                                               └─► notification patient
Patient ── pré-diagnostic IA ──► spécialité + médecins ──► réservation pré-remplie (M2)
Laboratoire ── résultat ──► notification ──► aide à l'interprétation IA (médecin)
```

---

## Sécurité et rôles

- Authentification **JWT stateless** (JJWT 0.12.5), jeton envoyé dans `Authorization: Bearer <token>`.
- `@PreAuthorize` sur chaque endpoint, plus des **contrôles de propriété** : un patient ne lit que ses
  propres RDV, factures, notifications et profil.
- Jeton absent, expiré ou falsifié → **401** ; rôle insuffisant → **403**.
- Le rôle utilisé par l'assistant est toujours celui du jeton, jamais une valeur envoyée par le client.

| Rôle | Espace | Accès principal |
|------|--------|-----------------|
| `ADMIN` | `/back` | Tout : utilisateurs, médecins, statistiques, factures, IA, pharmacie (lecture) |
| `MEDECIN` | `/back` | Ses RDV, consultations, patients, examens, ordonnances, analyses IA |
| `SECRETAIRE` | `/secretaire` | RDV, patients, plannings, consultations, factures |
| `PATIENT` | `/front` | Ses RDV, dossier, historique, pré-diagnostic, examens, factures |
| `LABO` | `/labo` | Examens à traiter, saisie et publication des résultats |
| `PHARMACIEN` | `/pharmacie` | Délivrance, stock, réceptions, catalogue, fournisseurs |

---

## API — principaux endpoints

### Rendez-vous (M2)
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/rendez-vous` | GET / POST | Liste, création (notifie médecin et patient) |
| `/api/rendez-vous/patient/{id}` · `/medecin/{id}` | GET | RDV d'un patient / d'un médecin |
| `/api/rendez-vous/{id}` | PUT / DELETE | Modification (changement de statut notifié), suppression |

Statuts : `PLANIFIE` · `CONFIRME` · `ANNULE` · `TERMINE`.
Rappel automatique envoyé une seule fois, 24 h avant le rendez-vous (tâche horaire).

### Dossier médical (M3)
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/consultations` | CRUD | Consultations |
| `/api/ordonnances` | GET / POST / PUT / DELETE | Ordonnances structurées (lignes : médicament, posologie, durée, quantité) |
| `/api/ordonnances/patient/{id}` | GET | Ordonnances d'un patient, avec leur statut de délivrance |
| `/api/examens` | CRUD | Examens de laboratoire |
| `/api/examens/{id}/resultat` | PUT | Saisie d'un résultat (notifie le patient et le médecin) |

### Facturation (M4)
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/factures` | CRUD | Factures et lignes de facture |
| `/api/factures/patient/{id}` | GET | Factures d'un patient |
| `/api/factures/{id}/pdf` | GET | Facture au format PDF (le patient ne télécharge que les siennes) |
| `/api/factures/{id}/paiement` | PUT | Enregistrement d'un paiement |
| `/api/statistiques`, `/api/statistiques-detail` | GET | Indicateurs (personnel uniquement) |

Montants en **dinars tunisiens (DT)**, trois décimales.

### IA & aide à la décision (M5)
| Endpoint | Méthode | Rôle | Description |
|----------|---------|------|-------------|
| `/api/ia/triage` | POST | Patient | Pré-diagnostic : niveau d'urgence, spécialité, médecins disponibles |
| `/api/ia/triages/moi` | GET | Patient | Historique des pré-diagnostics |
| `/api/ia/resume-dossier/{patientId}` | POST | Médecin, Admin | Résumé structuré du dossier |
| `/api/ia/interpretation/{examenId}` | POST | Médecin, Admin | Aide à l'interprétation d'un résultat |
| `/api/ia/analyses/{id}/validation` | PUT | Médecin | Validation humaine d'une analyse |
| `/api/ia/previsions` | GET | Admin | Charge prévue sur 7 jours, taux d'annulation, créneaux chargés, couverture du stock |
| `/api/ia/statut` · `/api/ia/journal` | GET | Admin | État du fournisseur IA et journal des appels |
| `/api/chatbot` | POST | Tous | Assistant MediAssist (réponses adaptées au rôle du jeton) |

Garde-fous :
- les données envoyées au modèle sont **pseudonymisées** (ni nom, ni numéro de dossier) ;
- délai maximal de 15 s, puis **repli automatique** sur le moteur de règles local ;
- chaque appel est **journalisé** (fonction, rôle, source, durée, succès) ;
- les analyses restent des **suggestions** : le médecin les valide, et les urgences vitales renvoient
  vers le **190** (SAMU) et le **198** (Protection civile).

### Pharmacie & stock (M6)
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/pharmacie/tableau-de-bord` | GET | Indicateurs, alertes, ordonnances en attente |
| `/api/pharmacie/medicaments` | CRUD | Catalogue (lecture ouverte aux médecins pour la prescription) |
| `/api/pharmacie/fournisseurs` | CRUD | Fournisseurs |
| `/api/pharmacie/stock` | GET | Stock par médicament et par lot |
| `/api/pharmacie/receptions` | POST | Réception d'un lot (n° de lot, péremption, quantité, prix) |
| `/api/pharmacie/ajustements` | POST | Ajustement d'inventaire motivé |
| `/api/pharmacie/lots-perimes/retrait` | POST | Retrait des lots périmés |
| `/api/pharmacie/mouvements` | GET | Traçabilité de tous les mouvements |
| `/api/pharmacie/alertes` | GET | Ruptures, stocks bas, péremptions à moins de 30 jours |
| `/api/pharmacie/ordonnances` | GET | Ordonnances à délivrer |
| `/api/pharmacie/delivrances` | POST / GET | Délivrance totale ou partielle, historique |

La délivrance prélève les lots selon la règle **FEFO** (premier périmé, premier sorti), sous verrou
pessimiste et dans une seule transaction : stock, bon de délivrance, statut de l'ordonnance et
facture du patient restent cohérents. Une tâche quotidienne (7 h) notifie la pharmacie des alertes.

### Notifications
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/notifications/utilisateur/{uid}` | GET | Notifications de l'utilisateur connecté |
| `/api/notifications/utilisateur/{uid}/count` | GET | Compteur des non lues |
| `/api/notifications/{id}/lire` · `/utilisateur/{uid}/lire-tout` | PUT | Marquer comme lu |

Les badges sont rafraîchis toutes les 15 à 30 secondes selon l'espace.

---

## Pages frontend

| Espace | Routes |
|--------|--------|
| Public | `/`, `/login`, `/register` |
| Administration / Médecin (`/back`) | `dashboard`, `patients`, `medecins`*, `plannings`, `rendez-vous`, `consultations`, `examens`, `ordonnances`, `laboratoire`, `factures`*, `notifications`, `statistiques`*, `statistiques-detail`*, `ia`*, `utilisateurs`*, `profil` |
| Secrétariat (`/secretaire`) | `dashboard`, `patients`, `rendez-vous`, `plannings`, `consultations`, `factures`, `notifications`, `profil` |
| Patient (`/front`) | `rdv`, `dossier`, `historique`, `triage`, `examens`, `factures`, `notifications` |
| Laboratoire (`/labo`) | `examens`, `resultats`, `notifications` |
| Pharmacie (`/pharmacie`) | `tableau-de-bord`, `ordonnances`, `stock`, `receptions`, `catalogue`, `notifications` |

\* réservé à l'administrateur.

---

## Architecture

```
projet_ia_se/
├── backend/                     Spring Boot 3.2.5 · Java 17
│   └── src/main/java/com/clinique/gestion/
│       ├── config/              Seeders, migration de schéma, devise, gestion des erreurs
│       ├── controller/          Contrôleurs REST
│       ├── dto/                 DTO (dont dto/ia et dto/pharmacie)
│       ├── entity/              Entités JPA
│       ├── repository/          Spring Data JPA
│       ├── security/            JWT, filtre, utilisateur courant
│       └── service/             Services métier, client IA, tâches planifiées
├── frontend/                    Angular 17 standalone
│   └── src/app/
│       ├── core/                Services API, auth, IA, pharmacie, guards, intercepteur
│       ├── layouts/             Un layout par espace (back, front, secrétaire, labo, pharmacie)
│       ├── pages/               back · front · labo · pharmacie · home · login · register
│       └── shared/              Chatbot, analyse IA, graphique, pipe montant, notifications
└── docs/rapport/                Rapport des six modules et prompts par module (PDF)
```

### Modèle de données (extrait)

```
Utilisateur 1 ── 0..1 Medecin | Patient          Utilisateur 1 ── * Notification
Patient     1 ── *    RendezVous, Consultation, Facture, ExamenLaboratoire, TriageSymptomes
Consultation 1 ── *   Ordonnance 1 ── * LigneOrdonnance * ── 1 Medicament
Medicament  1 ── *    LotMedicament * ── 0..1 Fournisseur
Ordonnance  1 ── *    Delivrance 1 ── * LigneDelivrance * ── 1 LotMedicament
LotMedicament 1 ── *  MouvementStock
Facture     1 ── *    LigneFacture
AnalyseIA   * ── 1    Patient (résumé) | ExamenLaboratoire (interprétation)
JournalIA             trace de chaque appel IA
```

---

## Notes techniques

- `ddl-auto=update` : Hibernate maintient le schéma. Les énumérations sont stockées en `VARCHAR` et
  les textes longs en `TEXT`, ce qui permet d'ajouter des valeurs (rôle `PHARMACIEN`, nouveaux types
  de notification) sans migration manuelle sur une base existante.
- `open-in-view=false` : les lectures de collections se font dans des transactions en lecture seule.
- La devise est centralisée côté backend (`config/Devise.java`) et côté frontend (`shared/montant.pipe.ts`).
