import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
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

        <div class="auth-title">Créer un compte</div>
        <div class="auth-subtitle">Rejoignez la clinique en tant que patient</div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label"><i class="fa fa-user"></i> Nom</label>
              <input class="form-control" formControlName="nom" placeholder="Dupont">
            </div>
            <div class="form-group">
              <label class="form-label"><i class="fa fa-user"></i> Prénom</label>
              <input class="form-control" formControlName="prenom" placeholder="Jean">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa fa-envelope"></i> Adresse e-mail</label>
            <input class="form-control" formControlName="email" type="email" placeholder="jean.dupont&#64;email.fr">
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa fa-phone"></i> Téléphone</label>
            <input class="form-control" formControlName="telephone" placeholder="06 00 00 00 00">
          </div>
          <div class="form-group">
            <label class="form-label"><i class="fa fa-lock"></i> Mot de passe</label>
            <div style="position:relative">
              <input class="form-control" formControlName="motDePasse" [type]="showPwd ? 'text' : 'password'" placeholder="Minimum 4 caractères">
              <button type="button" (click)="showPwd = !showPwd"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748b;font-size:14px">
                <i [class]="showPwd ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </button>
            </div>
            <small style="color:#ef4444;font-size:11.5px" *ngIf="form.get('motDePasse')?.invalid && form.get('motDePasse')?.touched">
              Mot de passe requis (minimum 4 caractères)
            </small>
          </div>

          <div class="alert alert-error" *ngIf="error">
            <i class="fa fa-circle-exclamation"></i> {{ error }}
          </div>

          <button class="btn btn-success btn-lg" type="submit" [disabled]="loading" style="width:100%; margin-top:4px">
            <span class="spinner" *ngIf="loading"></span>
            <i class="fa fa-user-plus" *ngIf="!loading"></i>
            {{ loading ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>

        <div class="auth-footer">
          Déjà inscrit ?
          <a routerLink="/login" class="auth-link"> Se connecter</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  error = '';
  loading = false;
  showPwd = false;
  form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    motDePasse: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Veuillez remplir tous les champs correctement.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/front'); },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Inscription impossible. Vérifiez vos informations.'; }
    });
  }
}
