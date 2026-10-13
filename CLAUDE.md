# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MediCare is a clinic management platform built as a 6-person school project. Spring Boot 3.2 / Java 17 backend (`backend/`), Angular 17 standalone frontend (`frontend/`), MySQL 8. It is split into six modules, one per team member:

| Module | Scope |
|---|---|
| M1 Users & Security | JWT auth, roles, accounts, profiles |
| M2 Appointments & Planning | RDV booking, doctor planning, hourly 24 h reminder job (`RappelRdvService`) |
| M3 Medical records | patients, consultations, structured prescriptions, lab exams |
| M4 Billing & Statistics | invoices, payments, dashboards |
| M5 AI & decision support | triage, file summary, result interpretation, forecasts, AI call journal, chatbot |
| M6 Pharmacy & Stock | catalogue, batches, FEFO dispensing, stock alerts (daily 7 h job `AlerteStockScheduler`) |

Roles: `ADMIN`, `MEDECIN`, `SECRETAIRE`, `PATIENT`, `LABO`, `PHARMACIEN`. Demo accounts (password `password`): `admin@`, `dr.martin@`, `secretaire@`, `patient.dupont@`, `labo@`, `pharmacien@clinique.local`.

## Commands

Backend (run from `backend/`, listens on http://localhost:8081, Swagger at `/swagger-ui.html`):
```bash
mvn spring-boot:run                          # needs MySQL; DB clinique_db is auto-created
mvn test                                     # all tests (H2 in-memory, no MySQL needed)
mvn test -Dtest=DelivranceFefoTest           # one class
mvn test -Dtest=SecuriteIntegrationTest#unJetonExpireRenvoie401   # one method
```
If `mvn` is not on PATH, IntelliJ bundles one at `<IntelliJ>/plugins/maven-plugin/lib/maven3/bin/mvn`. With XAMPP, the database is MariaDB 10.4 (start it with `C:\xampp\mysql_start.bat`; root has no password by default); Hibernate then logs a harmless "MySQL 5.5 no longer supported" warning.

Tests (`backend/src/test`) run under the `test` profile (`application-test.properties`: H2 in MySQL mode, empty Groq key so the rules engine is always used). The demo seeders run there too, so integration tests log in with the demo accounts. `SecuriteIntegrationTest` holds the 401/403 and ownership matrix; POST cases need a valid body because `@Valid` is checked before `@PreAuthorize` (an empty body yields 400, not 403). `DelivranceFefoTest` is `@Transactional` (rolled back) and runs as the pharmacist via `@WithUserDetails`. `AssistantIAServiceTest` is a pure Mockito test of the LLM fallback.
Config is via env vars only: `DB_URL`, `DB_USERNAME` (default `root`), `DB_PASSWORD` (default empty), `APP_JWT_SECRET` (≥ 32 chars), `APP_CORS_ORIGINS`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_API_URL`. Never hard-code secrets in `application.properties`.

Frontend (run from `frontend/`, http://localhost:4200, API base URL in `src/environments/environment.ts`):
```bash
npm install
npm start          # ng serve --port 4200
npm run build      # production build; use it as the type-check (no lint or unit-test setup exists)
```

Report PDFs (`docs/rapport/`): content lives in `data.py` (modules, stories, API) and `build_prompts.py` (prompt log). Regenerate with `python build.py` and `python build_prompts.py` (needs pypdf, Node + Playwright Chromium, poppler `pdftotext`). Diagrams are PlantUML sources in `diagrams/*.puml` rendered to SVG.

## Backend architecture

Package `com.clinique.gestion`: `controller` → `service` → `repository` (Spring Data JPA), with `dto` (`dto/ia`, `dto/pharmacie`) and `entity`. Identifiers, comments and messages are in French.

**Security is three layers; new endpoints need all of them.**
1. URL rules in `security/SecurityConfig.java`: `/api/auth/**`, `/api/chatbot/**`, Swagger and `GET /api/medecins/**` are public; everything else under `/api/**` requires a token. A missing/expired/forged token yields **401** (custom entry point); `JwtAuthenticationFilter` swallows JWT errors and leaves the request anonymous.
2. `@PreAuthorize("hasAnyRole(...)")` on every controller method → **403** for the wrong role.
3. Ownership checks in services via `security/UtilisateurCourant`: `verifierAccesPatient(patientId)` throws `AccessDeniedException` when a PATIENT touches another patient's data (no-op for staff roles); `patientConnecte()` resolves the caller's own record. Every service method reachable by PATIENT with a patient, appointment, consultation, exam, invoice or prescription id calls it. Never trust a role or user id sent by the client; take it from the token.

**Error mapping** (`config/GlobalExceptionHandler`): `IllegalArgumentException` → 400, `IllegalStateException` → 409 (business-rule conflict), `EntityNotFoundException` → 404, `AccessDeniedException` → 403, bean validation → 400. Services signal errors by throwing these, with French messages shown directly in the UI.

**Startup runners, in order**: `SchemaMigration` (@Order 0, converts legacy MySQL `ENUM`/`TINYTEXT` columns to `VARCHAR`/`TEXT`), `DataSeeder` (@Order 1, core demo data, only if no users exist), `ModulesDataSeeder` (@Order 2, M5/M6 demo data, each block idempotent). Schema is managed by `ddl-auto=update`; enums are stored as strings so new values need no migration. `open-in-view=false`, so lazy collections must be read inside `@Transactional(readOnly = true)` service methods.

**Chatbot history**: `ChatbotService.repondre(message, sessionId)` stores each exchange in `ChatMessage` (table `chat_messages`) for logged-in users only; a `sessionId` owned by someone else is never reused, and the history endpoints check ownership (owner or ADMIN).

**PDF exports**: invoices via `FacturePdfService` (`GET /api/factures/{id}/pdf`); prescriptions and exam results via `PdfExportService` (`GET /api/pdf/ordonnance|examen/{id}`). Both check patient ownership.

**Real-time notifications**: `NotificationService` also pushes over STOMP (`config/WebSocketConfig`, endpoint `/ws`, `NotificationWebSocketService`), but STOMP sessions carry no authenticated principal yet, so user-targeted pushes are not delivered; the layouts keep polling every 15 s.

**AI (M5)**: `service/ClientIA` is the only class that calls the external LLM (Groq, OpenAI-compatible, 15 s timeout). `estConfigure()` is false without `GROQ_API_KEY`. Every function in `AssistantIAService` (and `ChatbotService`) follows the same pattern: compute the rules-engine result, try the model if configured, fall back to rules on any exception, and record each attempt with `JournalIAService.tracer(fonction, source "GROQ"|"REGLES", ...)`. Data sent to the model is pseudonymised (`profilPseudonymise`: sex, age, history, allergies; no name or file number). In triage, an `URGENCE_VITALE` detected by the rules is never downgraded by the model, and vital emergencies point to 190 (SAMU) / 198 (Protection civile).

**Pharmacy (M6)**: `PharmacieService.delivrer` runs in one transaction: it takes batches from `LotMedicamentRepository.lotsDisponiblesFefo` (pessimistic write lock, non-expired, earliest expiry first), writes a `SORTIE` `MouvementStock` per batch, builds the `Delivrance` slip, updates `LigneOrdonnance.quantiteDelivree` and the prescription status (`PARTIELLE`/`COMPLETE`), creates the patient invoice through `FactureService.create` when `facturer` is true, and notifies the patient and pharmacists. Only structured prescriptions (with `lignes`) can be dispensed. Used medicines/suppliers are deactivated rather than deleted.

**Money**: amounts are `BigDecimal` in Tunisian dinars, 3 decimals. Server-side text uses `config/Devise.formater` ("1 234,500 DT"); the frontend uses the `montant` pipe / `formatMontant` in `shared/montant.pipe.ts` (non-breaking space before "DT"; amount inputs use `step="0.001"`). Invoice PDFs come from `FacturePdfService` (iText 7, `GET /api/factures/{id}/pdf`); the standard PDF fonts lack U+202F, so it swaps the French narrow space for U+00A0.

`SchemaMigration` also rewrites notifications stored by older versions (emoji prefixes, "€" amounts, ISO dates) at each startup, so legacy databases match today's conventions.

## Frontend architecture

All components are standalone with inline templates and styles; global styles in `src/styles.css`; icons from the bundled Font Awesome (no CDN). `styles.css` keeps a legacy global `label { display:flex; flex-direction:column }` rule: labels holding a `.req` asterisk are switched back to block, and checkbox labels must use `.mc-check`. Every route sets a `title`; `core/titre.strategy.ts` renders it as "<titre> · MediCare". Use the `initiales` pipe (`shared/initiales.pipe.ts`) for avatar initials ("Dr Jean Martin" → "JM").

- Planning pages (`/back/plannings`, `/secretaire/plannings`) use the FullCalendar-based `pages/back/calendar.component.ts`.
- `app.routes.ts`: one area per role, each with its own layout in `layouts/`: `/back` (ADMIN, MEDECIN; some children ADMIN-only via a nested `roleGuard`), `/secretaire`, `/front` (patient), `/labo`, `/pharmacie` (lazy `pages/pharmacie/pharmacie.routes.ts`). ADMIN may also open `/front`, `/labo` and `/pharmacie`. `roleGuard` reads `data.roles` and redirects to `AuthService.homeForRole()`.
- `core/auth.service.ts` stores the session in `localStorage` (`clinique_auth`, `clinique_token`); `core/auth.interceptor.ts` adds the Bearer token, drops expired tokens, and redirects to `/login` only on a 401 (a 403 keeps the session).
- HTTP calls go through `core/api.service.ts` (M1 to M4), `core/ia.service.ts` (M5) and `core/pharmacie.service.ts` (M6).
- Layouts poll notification counters every 15 to 30 s.

## Project rules

- The UI is in French; keep backend messages in French too.
- Tunisian context: amounts in DT with 3 decimals, emergency numbers 190 (SAMU) and 198 (Protection civile), never € or 15/112.
- No emojis in the UI.
- Every endpoint is secured by role and, for patient data, by ownership check.
- Secrets only in environment variables; the Groq key never reaches the browser.
