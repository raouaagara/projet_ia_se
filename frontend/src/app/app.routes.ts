import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FrontLayoutComponent } from './layouts/front-layout.component';
import { BackLayoutComponent } from './layouts/back-layout.component';
import { SecretaireLayoutComponent } from './layouts/secretaire-layout.component';

// ── Front (patient) ──────────────────────────────────────────────────────────
import { RendezVousFrontComponent } from './pages/front/rendez-vous-front.component';
import { DossierComponent } from './pages/front/dossier.component';
import { HistoriqueComponent } from './pages/front/historique.component';
import { MesExamensComponent } from './pages/front/mes-examens.component';
import { MesFacturesComponent } from './pages/front/mes-factures.component';
import { MesNotificationsComponent } from './pages/front/mes-notifications.component';

import { LaboLayoutComponent } from './layouts/labo-layout.component';
import { LaboExamensComponent } from './pages/labo/labo-examens.component';
import { LaboResultatsComponent } from './pages/labo/labo-resultats.component';
import { LaboNotificationsComponent } from './pages/labo/labo-notifications.component';
import { DashboardComponent } from './pages/back/dashboard.component';
import { PatientsComponent } from './pages/back/patients.component';
import { MedecinsComponent } from './pages/back/medecins.component';
import { PlanningsComponent } from './pages/back/plannings.component';
import { RendezVousBackComponent } from './pages/back/rendez-vous-back.component';
import { StatistiquesComponent } from './pages/back/statistiques.component';
import { StatistiquesDetailComponent } from './pages/back/statistiques-detail.component';
import { ConsultationsComponent } from './pages/back/consultations.component';
import { UtilisateursComponent } from './pages/back/utilisateurs.component';
import { ProfilComponent } from './pages/back/profil.component';
import { FacturesComponent } from './pages/back/factures.component';
import { ExamensComponent } from './pages/back/examens.component';
import { LaboratoireComponent } from './pages/back/laboratoire.component';
import { NotificationsComponent } from './pages/back/notifications.component';
import { OrdonnancesComponent } from './pages/back/ordonnances.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login',    component: LoginComponent, title: 'Connexion' },
  { path: 'register', component: RegisterComponent, title: 'Créer un compte' },

  // ── Espace Secrétaire ─────────────────────────────────────────────────────
  {
    path: 'secretaire',
    component: SecretaireLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SECRETAIRE'] },
    children: [
      { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       component: DashboardComponent, title: 'Secrétariat — Tableau de bord' },
      { path: 'patients',        component: PatientsComponent, title: 'Secrétariat — Patients' },
      { path: 'rendez-vous',     component: RendezVousBackComponent, title: 'Secrétariat — Rendez-vous' },
      { path: 'plannings',       component: PlanningsComponent, title: 'Secrétariat — Plannings' },
      { path: 'consultations',   component: ConsultationsComponent, title: 'Secrétariat — Consultations' },
      { path: 'factures',        component: FacturesComponent, title: 'Secrétariat — Factures' },
      { path: 'notifications',   component: NotificationsComponent, title: 'Secrétariat — Notifications' },
      { path: 'profil',          component: ProfilComponent, title: 'Mon profil' }
    ]
  },

  // ── Espace patient ───────────────────────────────────────────────────────
  {
    path: 'front',
    component: FrontLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT', 'ADMIN'] },
    children: [
      { path: '',          redirectTo: 'rdv', pathMatch: 'full' },
      { path: 'rdv',       component: RendezVousFrontComponent, title: 'Mes rendez-vous' },
      { path: 'dossier',   component: DossierComponent, title: 'Mon dossier médical' },
      { path: 'historique',component: HistoriqueComponent, title: 'Mon historique' },
      { path: 'triage',        title: 'Pré-diagnostic IA',
        loadComponent: () => import('./pages/front/triage.component').then(m => m.TriageComponent) },
      { path: 'examens',       component: MesExamensComponent, title: 'Mes examens' },
      { path: 'factures',      component: MesFacturesComponent, title: 'Mes factures' },
      { path: 'notifications', component: MesNotificationsComponent, title: 'Mes notifications' }
    ]
  },

  // ── Espace Laboratoire ────────────────────────────────────────────────────
  {
    path: 'labo',
    component: LaboLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LABO', 'ADMIN'] },
    children: [
      { path: '',             redirectTo: 'examens', pathMatch: 'full' },
      { path: 'examens',      component: LaboExamensComponent, title: 'Laboratoire — Examens' },
      { path: 'resultats',    component: LaboResultatsComponent, title: 'Laboratoire — Résultats' },
      { path: 'notifications',component: LaboNotificationsComponent, title: 'Laboratoire — Notifications' }
    ]
  },

  // ── Espace Pharmacie (module M6) ──────────────────────────────────────────
  {
    path: 'pharmacie',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PHARMACIEN', 'ADMIN'] },
    loadChildren: () => import('./pages/pharmacie/pharmacie.routes').then(m => m.PHARMACIE_ROUTES)
  },

  // ── Back-office ADMIN / MÉDECIN ───────────────────────────────────────────
  {
    path: 'back',
    component: BackLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MEDECIN'] },
    children: [
      { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       component: DashboardComponent, title: 'Tableau de bord' },
      { path: 'patients',        component: PatientsComponent, title: 'Patients' },
      { path: 'medecins',        component: MedecinsComponent, title: 'Médecins',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'plannings',       component: PlanningsComponent, title: 'Plannings' },
      { path: 'rendez-vous',     component: RendezVousBackComponent, title: 'Rendez-vous' },
      { path: 'consultations',   component: ConsultationsComponent, title: 'Consultations' },
      { path: 'examens',         component: ExamensComponent, title: 'Examens' },
      { path: 'ordonnances',     component: OrdonnancesComponent, title: 'Ordonnances' },
      { path: 'laboratoire',     component: LaboratoireComponent, title: 'Laboratoire' },
      { path: 'factures',        component: FacturesComponent, title: 'Factures',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'notifications',   component: NotificationsComponent, title: 'Notifications' },
      { path: 'statistiques',    component: StatistiquesComponent, title: 'Statistiques',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'statistiques-detail', component: StatistiquesDetailComponent, title: 'Statistiques détaillées',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'ia',              title: 'IA & aide à la décision', loadComponent: () => import('./pages/back/ia-admin.component').then(m => m.IaAdminComponent),
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'utilisateurs',    component: UtilisateursComponent, title: 'Utilisateurs',
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'profil',          component: ProfilComponent, title: 'Mon profil' }
    ]
  },

  { path: '**', redirectTo: '' }
];
