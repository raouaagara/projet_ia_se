import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor],
  template: `
    <div class="auth-split">
      <!-- ── Formulaire ── -->
      <section class="auth-form-side">
        <a routerLink="/" class="auth-brand"><img src="assets/logo.png" alt="MediCare"></a>

        <div class="auth-form-wrap">
          <span class="auth-eyebrow">Espace sécurisé</span>
          <h1 class="auth-title">Bon retour parmi nous</h1>
          <p class="auth-subtitle">Connectez-vous pour accéder à votre espace personnel.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <div class="form-group">
              <label class="form-label"><i class="fa fa-envelope"></i> Adresse e-mail</label>
              <input class="form-control" formControlName="email" type="email" placeholder="exemple&#64;clinique.fr">
            </div>
            <div class="form-group">
              <label class="form-label"><i class="fa fa-lock"></i> Mot de passe</label>
              <div class="auth-pwd">
                <input class="form-control" formControlName="motDePasse" [type]="showPwd ? 'text' : 'password'" placeholder="••••••••">
                <button type="button" class="auth-pwd-toggle" (click)="showPwd = !showPwd">
                  <i [class]="showPwd ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="alert alert-error" *ngIf="error">
              <i class="fa fa-circle-exclamation"></i> {{ error }}
            </div>

            <button class="auth-submit" type="submit" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              {{ loading ? 'Connexion...' : 'Se connecter' }}
              <i class="fa fa-arrow-right" *ngIf="!loading"></i>
            </button>
          </form>

          <div class="auth-divider">Comptes de démonstration</div>
          <div class="auth-demo-grid">
            <button type="button" class="auth-demo-chip" *ngFor="let d of comptesDemo" (click)="remplir(d.email)" [title]="d.email">
              <i [class]="d.icone"></i> {{ d.libelle }}
            </button>
          </div>
          <p class="auth-demo-note">Cliquez sur un rôle pour remplir le formulaire (mot de passe : <code>password</code>).</p>

          <div class="auth-footer">
            Pas encore de compte ?
            <a routerLink="/register" class="auth-link">Créer un compte patient</a>
          </div>
        </div>

        <div class="auth-legal">© 2026 MediCare — Clinique Médicale</div>
      </section>

      <!-- ── Visuel ── -->
      <aside class="auth-visual">
        <img class="auth-photo" alt="Médecin de la clinique"
             src="assets/auth-login.jpg">

        <div class="auth-badge"><i class="fa fa-heart-pulse"></i> Des médecins à votre écoute</div>

        <div class="auth-visual-head">
          <h2>Votre santé, <span>simplifiée</span> et suivie au quotidien.</h2>
          <p>Rendez-vous, résultats d'examens, ordonnances et factures : tout votre parcours de soins au même endroit.</p>
        </div>

        <div class="auth-stats">
          <div><b>24/7</b><span>Accès à votre dossier</span></div>
          <div><b>+15</b><span>Spécialités</span></div>
          <div><b>100%</b><span>Données sécurisées</span></div>
        </div>
      </aside>
    </div>
  `
})
export class LoginComponent {
  error = '';
  loading = false;
  showPwd = false;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required]
  });

  readonly comptesDemo = [
    { libelle: 'Administrateur', email: 'admin@clinique.local', icone: 'fa fa-shield-halved' },
    { libelle: 'Médecin',        email: 'dr.martin@clinique.local', icone: 'fa fa-user-doctor' },
    { libelle: 'Secrétaire',     email: 'secretaire@clinique.local', icone: 'fa fa-briefcase' },
    { libelle: 'Patient',        email: 'patient.dupont@clinique.local', icone: 'fa fa-user' },
    { libelle: 'Laboratoire',    email: 'labo@clinique.local', icone: 'fa fa-flask' },
    { libelle: 'Pharmacien',     email: 'pharmacien@clinique.local', icone: 'fa fa-prescription-bottle-medical' },
  ];

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  remplir(email: string): void {
    this.form.setValue({ email, motDePasse: 'password' });
    this.error = '';
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, motDePasse } = this.form.getRawValue();
    this.auth.login(email!, motDePasse!).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl(this.auth.homeForRole()); },
      error: () => { this.loading = false; this.error = 'Identifiants invalides. Vérifiez vos informations.'; }
    });
  }
}
