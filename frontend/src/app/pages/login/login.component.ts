import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <div class="auth-page">
      <div class="auth-bg-shapes">
        <span></span><span></span><span></span>
      </div>

      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon"><i class="fa fa-hospital"></i></div>
          <div class="auth-logo-text">
            <h2>MediCare</h2>
            <p>Clinique Médicale</p>
          </div>
        </div>

        <div class="auth-title">Connexion</div>
        <div class="auth-subtitle">Accédez à votre espace personnel</div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <div class="form-group">
            <label class="form-label"><i class="fa fa-envelope"></i> Adresse e-mail</label>
            <input class="form-control" formControlName="email" type="email" placeholder="exemple&#64;clinique.fr">
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa fa-lock"></i> Mot de passe</label>
            <input class="form-control" formControlName="motDePasse" type="password" placeholder="••••••••">
          </div>

          <div class="alert alert-error" *ngIf="error">
            <i class="fa fa-circle-exclamation"></i> {{ error }}
          </div>

          <button class="btn btn-primary btn-lg" type="submit" [disabled]="loading" style="width:100%; margin-top:4px">
            <span class="spinner" *ngIf="loading"></span>
            <i class="fa fa-right-to-bracket" *ngIf="!loading"></i>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <div class="auth-divider">Accès de test</div>
        <div style="background:#f8fafc; border-radius: 10px; padding: 12px 14px; font-size: 12.5px; color: #64748b; line-height: 1.8;">
          <strong>Admin :</strong> admin&#64;clinique.local / password<br>
          <strong>Patient :</strong> Créez un compte ci-dessous
        </div>

        <div class="auth-footer">
          Pas encore de compte ?
          <a routerLink="/register" class="auth-link"> Créer un compte patient</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  error = '';
  loading = false;
  form = this.fb.group({
    email: ['admin@clinique.local', [Validators.required, Validators.email]],
    motDePasse: ['password', Validators.required]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

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
