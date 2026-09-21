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
    <div class="auth-split">
      <!-- ── Formulaire ── -->
      <section class="auth-form-side">
        <a routerLink="/" class="auth-brand"><img src="assets/logo.png" alt="Medicare"></a>

        <div class="auth-form-wrap">
        <span class="auth-eyebrow">Espace patient</span>
        <h1 class="auth-title">Créer votre compte</h1>
        <p class="auth-subtitle">Rejoignez la clinique et gérez votre parcours de soins en ligne.</p>

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
            <div class="auth-pwd">
              <input class="form-control" formControlName="motDePasse" [type]="showPwd ? 'text' : 'password'" placeholder="Minimum 4 caractères">
              <button type="button" class="auth-pwd-toggle" (click)="showPwd = !showPwd">
                <i [class]="showPwd ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
              </button>
            </div>
            <small class="auth-field-error" *ngIf="form.get('motDePasse')?.invalid && form.get('motDePasse')?.touched">
              Mot de passe requis (minimum 4 caractères)
            </small>
          </div>

          <div class="alert alert-error" *ngIf="error">
            <i class="fa fa-circle-exclamation"></i> {{ error }}
          </div>

          <button class="auth-submit" type="submit" [disabled]="loading">
            <span class="spinner" *ngIf="loading"></span>
            {{ loading ? 'Création...' : 'Créer mon compte' }}
            <i class="fa fa-arrow-right" *ngIf="!loading"></i>
          </button>
        </form>

        <div class="auth-footer">
          Déjà inscrit ?
          <a routerLink="/login" class="auth-link">Se connecter</a>
        </div>
        </div>

        <div class="auth-legal">© 2026 Medicare — Clinique Médicale</div>
      </section>

      <!-- ── Visuel ── -->
      <aside class="auth-visual">
        <img class="auth-photo" alt="Médecin avec stéthoscope"
             src="assets/auth-register.jpg">

        <div class="auth-badge"><i class="fa fa-shield-heart"></i> Inscription gratuite &amp; sécurisée</div>

        <div class="auth-visual-head">
          <h2>Un compte, <span>tout votre suivi</span> médical.</h2>
          <p>Créez votre espace patient en moins d'une minute et gardez la main sur vos soins.</p>
        </div>

        <div class="auth-stats">
          <div><b>1 min</b><span>Pour s'inscrire</span></div>
          <div><b>Gratuit</b><span>Pour tous les patients</span></div>
          <div><b>24/7</b><span>Accès en ligne</span></div>
        </div>
      </aside>
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
