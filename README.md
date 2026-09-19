# 🏥 MediCare — Plateforme de Gestion Clinique

Application full-stack de gestion de clinique médicale.  
**Backend** : Spring Boot 3.2 · **Frontend** : Angular 17 standalone

---

## 🚀 Démarrage rapide

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
ng serve
```

**Comptes de démo** (mot de passe : `password`) :
| Rôle | Email |
|------|-------|
| Admin | admin@clinique.local |
| Médecin | dr.martin@clinique.local |
| Secrétaire | secretaire@clinique.local |
| Patient | patient.dupont@clinique.local |

---

## 📦 Architecture

```
clinique-medicale/
├── backend/          Spring Boot 3.2.5, Java 17, MySQL
│   └── src/main/java/com/clinique/gestion/
│       ├── config/       DataSeeder, WebConfig, SecurityConfig…
│       ├── controller/   REST controllers (14 modules)
│       ├── dto/          Data Transfer Objects
│       ├── entity/       Entités JPA (12 entités)
│       ├── repository/   Spring Data JPA repositories
│       ├── security/     JWT, filtre, UserDetailsService
│       └── service/      Logique métier (12 services)
└── frontend/         Angular 17 standalone, signals
    └── src/app/
        ├── core/         AuthService, ApiService, Guards, Interceptor
        ├── layouts/      FrontLayout, BackLayout
        ├── pages/
        │   ├── back/     Composants back-office (14 pages)
        │   └── front/    Composants espace patient (5 pages)
        └── shared/       Chatbot, MedecinWidget
```

---

## 🔐 Sécurité & Rôles

| Rôle | Description |
|------|-------------|
| `ADMIN` | Accès complet — gestion utilisateurs, médecins, stats, factures |
| `MEDECIN` | Ses RDV, consultations, patients, examens, ordonnances |
| `SECRETAIRE` | RDV, patients, factures, planning |
| `PATIENT` | Ses RDV, dossier, historique, examens, factures |

Authentification **JWT stateless** (JJWT 0.12.5). Token inclus en header `Authorization: Bearer <token>`.

---

## 📋 Modules implémentés

### 1. Gestion des Rendez-vous

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/rendez-vous` | GET | ADMIN, MEDECIN, SECRETAIRE |
| `/api/rendez-vous/{id}` | GET | tous authentifiés |
| `/api/rendez-vous/patient/{id}` | GET | tous authentifiés |
| `/api/rendez-vous/medecin/{id}` | GET | tous authentifiés |
| `/api/rendez-vous` | POST | ADMIN, SECRETAIRE, PATIENT |
| `/api/rendez-vous/{id}` | PUT | ADMIN, SECRETAIRE, MEDECIN |
| `/api/rendez-vous/{id}` | DELETE | ADMIN, SECRETAIRE |

**Statuts** : `PLANIFIE` · `CONFIRME` · `ANNULE` · `TERMINE`

**Entité** :
```
RendezVous { id, patient, medecin, dateHeure, motif, statut, notes }
```

---

### 2. Gestion des Consultations

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/consultations` | GET | ADMIN, MEDECIN, SECRETAIRE |
| `/api/consultations/patient/{id}` | GET | tous authentifiés |
| `/api/consultations/medecin/{id}` | GET | tous authentifiés |
| `/api/consultations` | POST | ADMIN, MEDECIN |
| `/api/consultations/{id}` | PUT | ADMIN, MEDECIN |
| `/api/consultations/{id}` | DELETE | ADMIN |

**Entité** :
```
Consultation { id, patient, medecin, rendezVous (optionnel),
               dateConsultation, diagnostic, observations, traitement }
```

**Ordonnances** (`/api/ordonnances`) :
```
Ordonnance { id, consultation, dateEmission, medicaments, posologie, instructions }
```
→ Notifie le patient à la création (`NOUVELLE_PRESCRIPTION`)

---

### 3. Facturation & Paiements

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/factures` | GET | ADMIN, SECRETAIRE, MEDECIN |
| `/api/factures/{id}` | GET | tous authentifiés |
| `/api/factures/patient/{id}` | GET | tous authentifiés |
| `/api/factures` | POST | ADMIN, SECRETAIRE |
| `/api/factures/{id}` | PUT | ADMIN, SECRETAIRE |
| `/api/factures/{id}` | DELETE | ADMIN |

**Statuts** : `EN_ATTENTE` · `PARTIELLEMENT_PAYE` · `PAYE` · `REMBOURSE` · `ANNULE`

**Entités** :
```
Facture { id, numeroFacture, patient, medecin, consultation,
          dateFacture, montantTotal, montantPaye, statut, notes,
          lignes: List<LigneFacture> }

LigneFacture { id, facture, description, quantite, prixUnitaire, total }
```
→ Notifie le patient à la création (`FACTURE_GENEREE`)  
→ Export "PDF" (texte) depuis le frontend

---

### 4. Examens & Laboratoire

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/examens` | GET | ADMIN, MEDECIN, SECRETAIRE |
| `/api/examens/patient/{id}` | GET | tous authentifiés |
| `/api/examens/medecin/{id}` | GET | ADMIN, MEDECIN, SECRETAIRE |
| `/api/examens` | POST | ADMIN, MEDECIN |
| `/api/examens/{id}` | PUT | ADMIN, MEDECIN, SECRETAIRE |
| `/api/examens/{id}` | DELETE | ADMIN, MEDECIN |

**Statuts** : `DEMANDE` · `EN_COURS` · `RESULTAT_DISPONIBLE` · `ANNULE`

**Entité** :
```
ExamenLaboratoire { id, patient, medecin, consultation, typeExamen,
                    description, statut, dateDemande, dateResultat,
                    resultatTexte, fichierResultat, notes }
```
→ Notifie le patient quand `statut → RESULTAT_DISPONIBLE`

---

### 5. Notifications

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/notifications/utilisateur/{id}` | GET | tous authentifiés |
| `/api/notifications/utilisateur/{id}/non-lues` | GET | tous authentifiés |
| `/api/notifications/utilisateur/{id}/count` | GET | tous authentifiés |
| `/api/notifications/{id}/lue` | PATCH | tous authentifiés |
| `/api/notifications/utilisateur/{id}/tout-lire` | PATCH | tous authentifiés |
| `/api/notifications/{id}` | DELETE | tous authentifiés |

**Types** : `RAPPEL_RDV` · `RESULTAT_DISPONIBLE` · `NOUVELLE_PRESCRIPTION` · `FACTURE_GENEREE` · `RDV_CONFIRME` · `RDV_ANNULE` · `INFORMATION`

**Rappels automatiques** : `RappelRdvService` — cron toutes les heures, envoie un rappel pour les RDV des prochaines 24h.

**Entité** :
```
Notification { id, utilisateur, titre, message, type, lue,
               dateCreation, referenceId, referenceType }
```

---

### 6. Statistiques & Dashboard Admin

| Endpoint | Méthode | Rôles |
|----------|---------|-------|
| `/api/statistiques` | GET | ADMIN, MEDECIN, SECRETAIRE |
| `/api/statistiques-detail` | GET | ADMIN, MEDECIN, SECRETAIRE |

**`StatistiqueDetailDto`** inclut :
- Patients, médecins (dispo / total)
- RDV par statut + taux confirmation/annulation
- Consultations, ordonnances
- Facturation : total factures, payées, en attente, revenus total + mois actuel
- Examens : total, demandés, résultats disponibles
- Top 5 médecins par nombre de RDV
- Utilisateurs actifs

---

## 🗄️ Modèle de données complet

```
Utilisateur (1) ──── (0..1) Medecin
Utilisateur (1) ──── (0..1) Patient
Patient     (1) ──── (*) RendezVous
Patient     (1) ──── (*) Consultation
Patient     (1) ──── (*) Facture
Patient     (1) ──── (*) ExamenLaboratoire
Medecin     (1) ──── (*) RendezVous
Medecin     (1) ──── (*) Consultation
Medecin     (1) ──── (*) Facture
Medecin     (1) ──── (*) ExamenLaboratoire
RendezVous  (1) ──── (0..1) Consultation
Consultation(1) ──── (*) Ordonnance
Consultation(1) ──── (0..1) Facture
Consultation(1) ──── (*) ExamenLaboratoire
Facture     (1) ──── (*) LigneFacture
Utilisateur (1) ──── (*) Notification
```

---

## 🖥️ Pages Frontend

### Back-office (ADMIN / MEDECIN / SECRETAIRE)
| Route | Composant | Accès |
|-------|-----------|-------|
| `/back/dashboard` | DashboardComponent | tous |
| `/back/patients` | PatientsComponent | tous |
| `/back/medecins` | MedecinsComponent | ADMIN |
| `/back/rendez-vous` | RendezVousBackComponent | tous |
| `/back/plannings` | PlanningsComponent | tous |
| `/back/consultations` | ConsultationsComponent | tous |
| `/back/examens` | **ExamensComponent** ✨ | tous |
| `/back/factures` | **FacturesComponent** ✨ | ADMIN, SECRETAIRE |
| `/back/notifications` | **NotificationsComponent** ✨ | tous |
| `/back/statistiques-detail` | **StatistiquesDetailComponent** ✨ | ADMIN |
| `/back/utilisateurs` | UtilisateursComponent | ADMIN |
| `/back/profil` | ProfilComponent | tous |

### Espace patient (PATIENT)
| Route | Composant | Description |
|-------|-----------|-------------|
| `/front/rdv` | RendezVousFrontComponent | Prise de RDV |
| `/front/dossier` | DossierComponent | Dossier médical |
| `/front/historique` | HistoriqueComponent | Historique |
| `/front/examens` | **MesExamensComponent** ✨ | Résultats d'examens |
| `/front/factures` | **MesFacturesComponent** ✨ | Mes factures |

---

## ⚙️ Configuration backend

`application.properties` :
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/clinique_db
spring.datasource.username=root
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

app.jwt.secret=votre-secret-jwt-min-32-chars
app.jwt.expiration-ms=86400000

app.cors.allowed-origins=http://localhost:4200

app.ai.api-url=https://api.groq.com/openai/v1/chat/completions
app.ai.api-key=votre-cle-groq
app.ai.model=llama3-8b-8192
```

---

## 🤖 Chatbot IA (MediAssist)

- **Modèle** : Llama 3 8B via Groq API
- **Appel direct** depuis le frontend (Angular) avec prompts adaptés au rôle
- **Fallback** : appel backend `/api/chatbot` + règles heuristiques
- **Contexte enrichi** : statistiques temps réel injectées dans le prompt système
- **Personnalisation** par rôle : ADMIN, MEDECIN, SECRETAIRE, PATIENT

---

## 📝 Notes d'implémentation

- **Rappels RDV** : scheduler `@Scheduled(cron = "0 0 * * * *")` — vérifie toutes les heures les RDV dans les 24h
- **Notifications** : déclenchées automatiquement à la création d'ordonnance, résultat examen disponible, génération de facture
- **Export PDF** : implémenté côté frontend (téléchargement `.txt` structuré) — intégration iText7 disponible côté backend (dépendances ajoutées dans `pom.xml`)
- **Sécurité méthode** : `@PreAuthorize` sur chaque endpoint, `@EnableMethodSecurity` activé
- **DataSeeder** : peuple la base au premier démarrage avec données de démo incluant une facture, deux examens et trois notifications
