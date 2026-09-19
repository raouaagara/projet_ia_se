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

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ── Espace Secrétaire ─────────────────────────────────────────────────────
  {
    path: 'secretaire',
    component: SecretaireLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SECRETAIRE'] },
    children: [
      { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       component: DashboardComponent },
      { path: 'patients',        component: PatientsComponent },
      { path: 'rendez-vous',     component: RendezVousBackComponent },
      { path: 'plannings',       component: PlanningsComponent },
      { path: 'consultations',   component: ConsultationsComponent },
      { path: 'factures',        component: FacturesComponent },
      { path: 'notifications',   component: NotificationsComponent },
      { path: 'profil',          component: ProfilComponent }
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
      { path: 'rdv',       component: RendezVousFrontComponent },
      { path: 'dossier',   component: DossierComponent },
      { path: 'historique',component: HistoriqueComponent },
      { path: 'examens',       component: MesExamensComponent },
      { path: 'factures',      component: MesFacturesComponent },
      { path: 'notifications', component: MesNotificationsComponent }
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
      { path: 'examens',      component: LaboExamensComponent },
      { path: 'resultats',    component: LaboResultatsComponent },
      { path: 'notifications',component: LaboNotificationsComponent }
    ]
  },

  // ── Back-office ADMIN / MÉDECIN ───────────────────────────────────────────
  {
    path: 'back',
    component: BackLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MEDECIN'] },
    children: [
      { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       component: DashboardComponent },
      { path: 'patients',        component: PatientsComponent },
      { path: 'medecins',        component: MedecinsComponent,
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'plannings',       component: PlanningsComponent },
      { path: 'rendez-vous',     component: RendezVousBackComponent },
      { path: 'consultations',   component: ConsultationsComponent },
      { path: 'examens',         component: ExamensComponent },
      { path: 'laboratoire',     component: LaboratoireComponent },
      { path: 'factures',        component: FacturesComponent,
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'notifications',   component: NotificationsComponent },
      { path: 'statistiques',    component: StatistiquesComponent,
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'statistiques-detail', component: StatistiquesDetailComponent,
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'utilisateurs',    component: UtilisateursComponent,
        canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'profil',          component: ProfilComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
