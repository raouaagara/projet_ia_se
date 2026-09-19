# 🏥 MediCare — Plateforme de Gestion Clinique

Application full-stack de gestion de clinique médicale.  
**Backend** : Spring Boot 3.2 · **Frontend** : Angular 17 standalone · **BD** : MySQL

---

## 🚀 Démarrage rapide

### Prérequis
- Java 17+
- Maven 3.8+
- Node.js 18+ / npm
- MySQL 8+

### Backend
```bash
cd backend
# Configurer application.properties (BDD + clé Groq)
mvn spring-boot:run
# Accessible sur http://localhost:8081
# Swagger UI : http://localhost:8081/swagger-ui.html
```

### Frontend
```bash
cd frontend
npm install
ng serve
# Accessible sur http://localhost:4200
```

---

## 👤 Comptes de démo

Mot de passe pour tous : **`password`**

| Rôle | Email | Espace |
|------|-------|--------|
| Admin | admin@clinique.local | `/back` |
| Médecin | dr.martin@clinique.local | `/back` |
| Secrétaire | secretaire@clinique.local | `/secretaire` |
| Patient | patient.dupont@clinique.local | `/front` |
| Laboratoire | labo@clinique.local | `/labo` |

---

## 📦 Architecture

```
clinique-medicale/
├── backend/          Spring Boot 3.2.5 · Java 17 · MySQL
│   └── src/main/java/com/clinique/gestion/
│       ├── config/       DataSeeder, WebConfig, OpenApiConfig, GlobalExceptionHandler
│       ├── controller/   14 REST controllers
│       ├── dto/          Data Transfer Objects
│       ├── entity/       12 entités JPA
│       ├── repository/   Spring Data JPA
│       ├── security/     JWT · JwtAuthFilter · CustomUserDetailsService
│       └── service/      12 services métier
└── frontend/         Angular 17 standalone
    └── src/app/
        ├── core/         AuthService · ApiService · authGuard · roleGuard · authInterceptor
        ├── layouts/      BackLayout · FrontLayout · SecretaireLayout · LaboLayout
        ├── pages/
        │   ├── back/     14 composants back-office (Admin + Médecin)
        │   ├── front/    6 composants espace patient
        │   └── labo/     3 composants espace laboratoire
        └── shared/       NotificationsListComponent · ChatbotComponent
```

---

## 🔐 Sécurité & Rôles

Authentification **JWT stateless** (JJWT 0.12.5). Token envoyé en header `Authorization: Bearer <token>`.

| Rôle | Espace | Accès |
|------|--------|-------|
| `ADMIN` | `/back` | Tout — utilisateurs, médecins, stats, factures, labos |
| `MEDECIN` | `/back` | Ses RDV, consultations, patients, examens, ordonnances |
| `SECRETAIRE` | `/secretaire` | RDV, patients, factures, consultations, planning |
| `PATIENT` | `/front` | Ses RDV, dossier, historique, examens, factures, notifications |
| `LABO` | `/labo` | Examens à traiter, saisie des résultats, notifications |

---

## 📋 Modules fonctionnels

### 1. Rendez-vous

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/rendez-vous` | GET | Liste complète |
| `/api/rendez-vous/patient/{id}` | GET | RDV d'un patient |
| `/api/rendez-vous/medecin/{id}` | GET | RDV d'un médecin |
| `/api/rendez-vous` | POST | Créer un RDV → notifie médecin + patient |
| `/api/rendez-vous/{id}` | PUT | Modifier (changement statut → notifie) |
| `/api/rendez-vous/{id}` | DELETE | Supprimer |

**Statuts** : `PLANIFIE` · `CONFIRME` · `ANNULE` · `TERMINE`

---

### 2. Consultations & Ordonnances

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/consultations` | GET/POST/PUT/DELETE | CRUD consultation |
| `/api/consultations/patient/{id}` | GET | Consultations d'un patient |
| `/api/consultations/medecin/{id}` | GET | Consultations d'un médecin |
| `/api/ordonnances` | GET/POST/PUT/DELETE | CRUD ordonnance |
| `/api/ordonnances/patient/{id}` | GET | Ordonnances d'un patient |

---

### 3. Examens & Laboratoire

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/examens` | GET/POST/PUT/DELETE | CRUD examens |
| `/api/examens/patient/{id}` | GET | Examens d'un patient |
| `/api/examens/medecin/{id}` | GET | Examens d'un médecin |
| `/api/examens/{id}/resultat` | PUT | Saisir résultat → notifie patient |
| `/api/labo/resultats` | POST | Publication résultat depuis espace labo |

**Statuts** : `DEMANDE` · `EN_COURS` · `RESULTAT_DISPONIBLE` · `ANNULE`

---

### 4. Facturation

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/factures` | GET/POST/PUT/DELETE | CRUD factures |
| `/api/factures/patient/{id}` | GET | Factures d'un patient |
| `/api/factures/{id}/paiement` | PUT | Enregistrer paiement |
| `/api/factures/stats` | GET | Statistiques financières |

**Statuts** : `EN_ATTENTE` · `PARTIELLEMENT_PAYE` · `PAYE` · `REMBOURSE` · `ANNULE`

> Création d'une facture → notification automatique au patient (`FACTURE_GENEREE`)

---

### 5. Notifications

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/notifications/utilisateur/{uid}` | GET | Toutes les notifs |
| `/api/notifications/utilisateur/{uid}/non-lues` | GET | Notifs non lues |
| `/api/notifications/utilisateur/{uid}/count` | GET | Compteur non lues |
| `/api/notifications/{id}/lire` | PUT | Marquer une notif lue |
| `/api/notifications/utilisateur/{uid}/lire-tout` | PUT | Tout marquer lu |
| `/api/notifications/{id}` | DELETE | Supprimer une notif |

**Types** : `RAPPEL_RDV` · `RDV_CONFIRME` · `RDV_ANNULE` · `RESULTAT_DISPONIBLE` · `NOUVELLE_PRESCRIPTION` · `FACTURE_GENEREE` · `INFORMATION`

**Déclenchements automatiques** :
- Création RDV → notifie médecin (`RAPPEL_RDV`) + patient (`RDV_CONFIRME`)
- Confirmation RDV → notifie les deux (`RDV_CONFIRME`)
- Annulation RDV → notifie les deux (`RDV_ANNULE`)
- Résultat examen disponible → notifie patient (`RESULTAT_DISPONIBLE`)
- Nouvelle facture → notifie patient (`FACTURE_GENEREE`)
- **Rappels automatiques** : `RappelRdvService` — cron horaire, rappels 24h avant RDV

**Badge temps réel** : polling toutes les 15 secondes dans les layouts.

---

### 6. Statistiques & Dashboard

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/statistiques` | GET | KPIs globaux |
| `/api/statistiques-detail` | GET | Analyse complète |

Dashboard adaptatif selon le rôle : KPIs différents pour Admin, Médecin et Secrétaire.

---

## 🖥️ Pages Frontend

### Espace Admin / Médecin (`/back`)
| Route | Composant | Rôles |
|-------|-----------|-------|
| `/back/dashboard` | DashboardComponent | Admin, Médecin |
| `/back/patients` | PatientsComponent | Admin, Médecin |
| `/back/medecins` | MedecinsComponent | Admin |
| `/back/rendez-vous` | RendezVousBackComponent | Admin, Médecin |
| `/back/plannings` | PlanningsComponent | Admin, Médecin |
| `/back/consultations` | ConsultationsComponent | Admin, Médecin |
| `/back/examens` | ExamensComponent | Admin, Médecin |
| `/back/laboratoire` | LaboratoireComponent | Admin |
| `/back/factures` | FacturesComponent | Admin |
| `/back/notifications` | NotificationsComponent | Admin, Médecin |
| `/back/statistiques-detail` | StatistiquesDetailComponent | Admin |
| `/back/utilisateurs` | UtilisateursComponent | Admin |
| `/back/profil` | ProfilComponent | Admin, Médecin |

### Espace Secrétaire (`/secretaire`)
| Route | Description |
|-------|-------------|
| `/secretaire/dashboard` | Tableau de bord |
| `/secretaire/rendez-vous` | Gestion des RDV |
| `/secretaire/patients` | Liste patients |
| `/secretaire/consultations` | Consultations |
| `/secretaire/factures` | Facturation |
| `/secretaire/notifications` | Notifications |

### Espace Patient (`/front`)
| Route | Description |
|-------|-------------|
| `/front/rdv` | Prise de rendez-vous |
| `/front/dossier` | Dossier médical |
| `/front/historique` | Historique consultations |
| `/front/examens` | Résultats d'examens |
| `/front/factures` | Mes factures |
| `/front/notifications` | Mes notifications |

### Espace Laboratoire (`/labo`)
| Route | Description |
|-------|-------------|
| `/labo/examens` | Examens à traiter |
| `/labo/resultats` | Saisie des résultats |
| `/labo/notifications` | Notifications |

---

## ⚙️ Configuration backend

Fichier : `backend/src/main/resources/application.properties`

```properties
server.port=8081

spring.datasource.url=jdbc:mysql://localhost:3306/clinique_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update

app.jwt.secret=VotreSecretJwtMinimum32Caracteres
app.jwt.expiration-ms=604800000

app.cors.allowed-origins=http://localhost:4200

app.ai.api-url=https://api.groq.com/openai/v1/chat/completions
app.ai.api-key=YOUR_GROQ_API_KEY
app.ai.model=qwen/qwen3.8-27b
```

---

## 🤖 Chatbot IA — MediAssist

- **Modèle** : Qwen 3.8-27B via [Groq API](https://console.groq.com)
- **Appel hybride** : direct depuis Angular avec fallback sur `/api/chatbot`
- **Prompt adaptatif** selon le rôle connecté (Admin, Médecin, Patient…)
- **Contexte enrichi** : statistiques temps réel injectées dans le prompt système

---

## 🗄️ Modèle de données

```
Utilisateur (1) ──── (0..1) Medecin
Utilisateur (1) ──── (0..1) Patient
Utilisateur (1) ──── (*)    Notification
Patient     (1) ──── (*)    RendezVous
Patient     (1) ──── (*)    Consultation
Patient     (1) ──── (*)    Facture
Patient     (1) ──── (*)    ExamenLaboratoire
Medecin     (1) ──── (*)    RendezVous
Medecin     (1) ──── (*)    Consultation
RendezVous  (1) ──── (0..1) Consultation
Consultation(1) ──── (*)    Ordonnance
Facture     (1) ──── (*)    LigneFacture
```

---

## 📝 Notes techniques

- **DataSeeder** : peuple la BD au premier démarrage (données de démo)
- **`ddl-auto=update`** : Hibernate crée/met à jour le schéma automatiquement
- **`@EnableMethodSecurity`** + `@PreAuthorize` sur chaque endpoint
- **Polling notifications** : toutes les 15 s dans les layouts
- **Popup temps réel** : dans `FrontLayoutComponent` — détecte les nouvelles notifs et affiche une popup animée
