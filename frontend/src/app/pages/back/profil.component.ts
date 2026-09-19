import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MedecinWidgetComponent } from '../../shared/medecin-widget.component';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, MedecinWidgetComponent],
  template: `
    <div class="prof-page">

      <!-- ══ LAYOUT : widget gauche + form droite ══ -->
      <div class="prof-layout" [class.prof-layout-full]="!isMedecin()">

      <!-- ── WIDGET PREVIEW ──────────────────────── -->
        <aside class="prof-aside" *ngIf="isMedecin()">
          <div class="prof-aside-title">
            <i class="fa fa-eye"></i> Aperçu de votre fiche
          </div>
          <app-medecin-widget [medecin]="previewMedecin()"></app-medecin-widget>

          <div class="prof-aside-hint">
            <i class="fa fa-circle-info"></i>
            Cette fiche est visible par les patients lors de la prise de rendez-vous.
          </div>
        </aside>

        <!-- ── FORM ─────────────────────────────────── -->
        <div class="prof-main">

          <!-- Header -->
          <div class="prof-header">
            <div class="prof-avatar">
              {{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}
            </div>
            <div>
              <h2 class="prof-name">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</h2>
              <div class="prof-role-badge">
                <i [class]="roleIcon()"></i> {{ auth.role() }}
              </div>
              <div class="prof-email">{{ auth.current()?.email }}</div>
            </div>
            <div class="prof-saved" *ngIf="saved">
              <i class="fa fa-circle-check"></i> Profil mis à jour !
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="prof-form">

            <!-- ── SECTION PRO (médecin) ──────────── -->
            <div class="prof-section" *ngIf="isMedecin()">              <div class="prof-sec-head">
                <div class="prof-sec-icon" style="background:#dbeafe;color:#1d4ed8"><i class="fa fa-user-doctor"></i></div>
                <span>Informations professionnelles</span>
                <span class="prof-sec-hint">Visibles par les patients</span>
              </div>
              <div class="prof-grid">

                <div class="prof-field">
                  <label>Spécialité <span class="req">*</span></label>
                  <select formControlName="specialite">
                    <option value="">— Choisir —</option>
                    <option *ngFor="let s of specialites" [value]="s">{{ s }}</option>
                  </select>
                </div>

                <div class="prof-field">
                  <label>Matricule</label>
                  <input formControlName="matricule" readonly style="opacity:.55;cursor:not-allowed">
                </div>

                <div class="prof-field">
                  <label>Faculté / École de médecine</label>
                  <select formControlName="faculte" (change)="onFaculteChange($event)">
                    <option value="">— Choisir —</option>
                    <optgroup label="🇹🇳 Tunisie">
                      <option *ngFor="let f of facultesTunisie" [value]="f">{{ f }}</option>
                    </optgroup>
                    <optgroup label="🇫🇷 France">
                      <option *ngFor="let f of facultesFrance" [value]="f">{{ f }}</option>
                    </optgroup>
                    <option value="Autre">Autre (saisir manuellement)</option>
                  </select>
                  <input *ngIf="showFaculteAutre"
                    class="prof-input-autre"
                    formControlName="faculteAutre"
                    placeholder="Saisissez le nom de votre faculté…"
                    autofocus>
                </div>

                <div class="prof-field">
                  <label>Disponibilité</label>
                  <select formControlName="disponible">
                    <option [ngValue]="true">✅ Disponible</option>
                    <option [ngValue]="false">❌ Indisponible</option>
                  </select>
                </div>

                <div class="prof-field prof-span2">
                  <label>Horaires de consultation</label>
                  <div class="prof-horaires-wrap">
                    <select class="prof-horaire-select" (change)="addHoraire($event)">
                      <option value="">+ Ajouter un créneau</option>
                      <option *ngFor="let h of horairesPredefinis" [value]="h">{{ h }}</option>
                    </select>
                    <input formControlName="horaires" placeholder="Ex: Lun-Ven 9h-17h, Sam 9h-12h">
                  </div>
                  <div class="prof-horaires-chips">
                    <span class="prof-hchip" *ngFor="let h of horairesList()" (click)="removeHoraire(h)">
                      <i class="fa fa-clock"></i> {{ h }} <i class="fa fa-xmark"></i>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- ── SECTION PRO (secrétaire) ─────────── -->
            <div class="prof-section" *ngIf="isSecretaire()">
              <div class="prof-sec-head">
                <div class="prof-sec-icon" style="background:#fff7ed;color:#c2410c"><i class="fa fa-briefcase"></i></div>
                <span>Rattachement médecin</span>
                <span class="prof-sec-hint">Médecin pour lequel vous travaillez</span>
              </div>
              <div class="prof-grid">
                <div class="prof-field prof-span2">
                  <label>Médecin rattaché</label>
                  <select formControlName="medecinRattacheId">
                    <option value="">— Aucun rattachement —</option>
                    <option *ngFor="let m of medecins" [value]="m.id">
                      Dr {{ m.prenom }} {{ m.nom }} — {{ m.specialite }}
                    </option>
                  </select>
                  <small style="color:var(--text-muted,#94a3b8);font-size:11.5px;margin-top:4px">
                    Ce rattachement permet de lier vos actions au bon médecin.
                  </small>
                </div>
              </div>
            </div>

            <!-- ── SECTION CONTACT ───────────────── -->
            <div class="prof-section">
              <div class="prof-sec-head">
                <div class="prof-sec-icon" style="background:#dcfce7;color:#15803d"><i class="fa fa-address-card"></i></div>
                <span>Coordonnées</span>
              </div>
              <div class="prof-grid">
                <div class="prof-field">
                  <label>Nom <span class="req">*</span></label>
                  <input formControlName="nom" placeholder="Martin">
                </div>
                <div class="prof-field">
                  <label>Prénom <span class="req">*</span></label>
                  <input formControlName="prenom" placeholder="Jean">
                </div>
                <div class="prof-field">
                  <label>Email <span class="req">*</span></label>
                  <input formControlName="email" type="email">
                </div>
                <div class="prof-field">
                  <label>Téléphone</label>
                  <input formControlName="telephone" placeholder="06 00 00 00 00">
                </div>
              </div>
            </div>

            <!-- ── SECTION SÉCURITÉ ──────────────── -->
            <div class="prof-section">
              <div class="prof-sec-head">
                <div class="prof-sec-icon" style="background:#f3e8ff;color:#7e22ce"><i class="fa fa-lock"></i></div>
                <span>Sécurité</span>
                <span class="prof-sec-hint">Laisser vide pour ne pas changer</span>
              </div>
              <div class="prof-grid">
                <div class="prof-field">
                  <label>Nouveau mot de passe</label>
                  <div class="prof-pwd-wrap">
                    <input [type]="showPwd?'text':'password'" formControlName="motDePasse" placeholder="Minimum 4 caractères">
                    <button type="button" (click)="showPwd=!showPwd">
                      <i [class]="showPwd?'fa fa-eye-slash':'fa fa-eye'"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div class="prof-error" *ngIf="errMsg">
              <i class="fa fa-triangle-exclamation"></i> {{ errMsg }}
            </div>

            <!-- Footer -->
            <div class="prof-footer">
              <div class="prof-hint">
                <i class="fa fa-shield-halved" style="color:#22c55e"></i>
                Modifications sécurisées
              </div>
              <button type="submit" class="prof-btn" [disabled]="loading || form.invalid">
                <span class="prof-spin" *ngIf="loading"></span>
                <i class="fa fa-floppy-disk" *ngIf="!loading"></i>
                {{ loading ? 'Enregistrement…' : 'Sauvegarder' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prof-page { animation: fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes popIn  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }

    /* Layout */
    .prof-layout { display:grid; grid-template-columns:300px 1fr; gap:24px; align-items:start; }
    .prof-layout.prof-layout-full { grid-template-columns:1fr; max-width:720px; margin:0 auto; }
    @media(max-width:900px) { .prof-layout { grid-template-columns:1fr; } }

    /* Aside widget */
    .prof-aside { display:flex; flex-direction:column; gap:14px; position:sticky; top:84px; }
    .prof-aside-title {
      font-size:12.5px; font-weight:700; color:var(--text-muted,#64748b);
      text-transform:uppercase; letter-spacing:.06em; display:flex; align-items:center; gap:7px;
    }
    .prof-aside-hint {
      display:flex; align-items:flex-start; gap:8px;
      font-size:12px; color:var(--text-muted,#94a3b8); line-height:1.5;
      background:var(--bg,#f8fafc); border-radius:10px; padding:10px 12px;
      border:1px solid var(--border,#f1f5f9);
    }
    .prof-aside-hint i { color:#0f6cbd; flex-shrink:0; margin-top:2px; }

    /* Header */
    .prof-header {
      display:flex; align-items:center; gap:18px;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      border-radius:18px; padding:24px 28px; color:#fff; margin-bottom:20px;
      box-shadow:0 6px 24px rgba(15,108,189,.3);
    }
    .prof-avatar {
      width:64px; height:64px; border-radius:18px; flex-shrink:0;
      background:rgba(255,255,255,.25); border:2px solid rgba(255,255,255,.4);
      display:flex; align-items:center; justify-content:center;
      font-size:24px; font-weight:900; color:#fff;
    }
    .prof-name       { font-size:20px; font-weight:900; margin:0 0 5px; }
    .prof-role-badge {
      display:inline-flex; align-items:center; gap:6px;
      background:rgba(255,255,255,.2); padding:3px 12px; border-radius:999px;
      font-size:11.5px; font-weight:700; margin-bottom:3px;
    }
    .prof-email { font-size:12.5px; color:rgba(255,255,255,.75); }
    .prof-saved {
      margin-left:auto; display:flex; align-items:center; gap:7px;
      background:rgba(255,255,255,.2); padding:8px 16px; border-radius:12px;
      font-size:13px; font-weight:700; animation:popIn .3s ease; white-space:nowrap;
    }

    /* Form */
    .prof-form { display:flex; flex-direction:column; gap:14px; }
    .prof-section {
      background:var(--surface,#fff); border-radius:16px; padding:20px 22px;
      border:1.5px solid var(--border,#e2e8f0); box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .prof-sec-head {
      display:flex; align-items:center; gap:10px;
      font-size:14px; font-weight:800; color:var(--text,#0f172a); margin-bottom:16px;
    }
    .prof-sec-icon {
      width:32px; height:32px; border-radius:9px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:14px;
    }
    .prof-sec-hint { font-size:11.5px; color:var(--text-muted,#94a3b8); font-weight:400; margin-left:4px; }

    .prof-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .prof-span2 { grid-column:span 2; }

    .prof-field { display:flex; flex-direction:column; gap:5px; }
    .prof-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .req { color:#ef4444; }
    .prof-field input, .prof-field select {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px; outline:none;
      transition:all .2s; font-family:inherit;
    }
    .prof-field input:focus, .prof-field select:focus {
      border-color:#0f6cbd; background:#fff; box-shadow:0 0 0 3px rgba(15,108,189,.08);
    }

    /* Horaires */
    .prof-horaires-wrap { display:flex; gap:8px; }
    .prof-horaire-select { flex-shrink:0; width:200px; }
    .prof-horaires-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .prof-hchip {
      display:inline-flex; align-items:center; gap:5px;
      padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600;
      background:#e8f4ff; color:#0f6cbd; cursor:pointer; transition:all .15s;
    }
    .prof-hchip:hover { background:#fee2e2; color:#dc2626; }
    .prof-hchip i:last-child { font-size:10px; }

    /* PWD */
    .prof-pwd-wrap { position:relative; }
    .prof-pwd-wrap input { width:100%; box-sizing:border-box; padding-right:40px; }
    .prof-pwd-wrap button {
      position:absolute; right:10px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; color:var(--text-muted,#94a3b8); font-size:14px;
    }

    .prof-input-autre {
      margin-top:8px; padding:9px 12px; border-radius:10px;
      border:1.5px solid #0f6cbd; background:#f0f9ff; color:var(--text,#0f172a);
      font-size:13.5px; outline:none; width:100%; box-sizing:border-box;
      font-family:inherit; transition:border-color .2s;
      animation: fadeUp .2s ease;
    }
    .prof-input-autre:focus { border-color:#0a4f99; box-shadow:0 0 0 3px rgba(15,108,189,.1); }
    .prof-input-autre::placeholder { color:#94a3b8; }

    /* Error */
    .prof-error {
      display:flex; align-items:center; gap:8px;
      background:#fff5f5; color:#dc2626; border:1.5px solid #fca5a5;
      border-radius:10px; padding:11px 14px; font-size:13px;
    }

    /* Footer */
    .prof-footer {
      display:flex; align-items:center; justify-content:space-between;
      background:var(--bg,#f8fafc); border-radius:14px; padding:14px 20px;
      border:1.5px solid var(--border,#f1f5f9);
    }
    .prof-hint { font-size:13px; color:var(--text-muted,#94a3b8); display:flex; align-items:center; gap:7px; }
    .prof-btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:11px 24px; border-radius:12px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:14px; font-weight:700; transition:all .22s;
      box-shadow:0 4px 14px rgba(15,108,189,.3);
    }
    .prof-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,108,189,.4); }
    .prof-btn:disabled { opacity:.5; cursor:not-allowed; }
    .prof-spin {
      width:14px; height:14px; border-radius:50%;
      border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
      animation:spin .6s linear infinite; display:inline-block;
    }
  `]
})
export class ProfilComponent implements OnInit {
  medecinId?: number;
  utilisateurId?: number;
  saved = false;
  loading = false;
  showPwd = false;
  errMsg = '';
  medecins: any[] = [];

  specialites = [
    'Médecine Générale', 'Cardiologie', 'Neurologie', 'Orthopédie',
    'Ophtalmologie', 'Pédiatrie', 'Chirurgie', 'Dermatologie',
    'Gynécologie', 'Rhumatologie', 'Gastro-entérologie', 'Endocrinologie',
    'Pneumologie', 'Urologie', 'Oncologie', 'Psychiatrie',
    'Anesthésiologie', 'Radiologie', 'Médecine d\'urgence', 'Néphrologie'
  ];

  showFaculteAutre = false;

  facultesTunisie = [
    'Faculté de Médecine de Tunis',
    'Faculté de Médecine de Sfax',
    'Faculté de Médecine de Sousse',
    'Faculté de Médecine de Monastir',
    'Faculté de Médecine de Bizerte',
  ];

  facultesFrance = [
    'Université Paris Cité (Paris 5)',
    'Sorbonne Université (Paris 6)',
    'Université Paris Diderot (Paris 7)',
    'Université Paris-Saclay',
    'Université de Lyon 1',
    'Université de Montpellier',
    'Université de Bordeaux',
    'Université de Lille',
    'Université de Strasbourg',
    'Université de Marseille (Aix-Marseille)',
    'Université de Nice Sophia Antipolis',
    'Université de Rennes 1',
    'Université de Nantes',
    'Université de Grenoble',
  ];

  horairesPredefinis = [
    'Lun-Ven 8h-12h',
    'Lun-Ven 14h-18h',
    'Lun-Ven 8h-17h',
    'Lun-Ven 9h-17h',
    'Lun-Sam 8h-12h',
    'Lun-Sam 9h-17h',
    'Lun-Jeu 8h-17h',
    'Mar-Sam 9h-17h',
    'Sam 9h-13h',
    'Sam 9h-12h',
    'Sur rendez-vous uniquement',
    'Urgences 24h/24'
  ];

  form = this.fb.group({
    nom:        ['', Validators.required],
    prenom:     ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    telephone:  [''],
    motDePasse: [''],
    specialite: [''],
    matricule:  [''],
    horaires:   [''],
    faculte:    [''],
    faculteAutre: [''],
    disponible: [true],
    medecinRattacheId: [null as number | null],
  });

  constructor(private fb: FormBuilder, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.utilisateurId = uid;
    this.form.patchValue({
      nom:   this.auth.current()?.nom ?? '',
      prenom:this.auth.current()?.prenom ?? '',
      email: this.auth.current()?.email ?? '',
    });
    if (this.isMedecin()) {
      this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
        if (!m) return;
        this.medecinId = m.id;
        const isAutre = m.faculte && ![...this.facultesTunisie, ...this.facultesFrance].includes(m.faculte);
        this.showFaculteAutre = !!isAutre;
        this.form.patchValue({
          nom: m.nom, prenom: m.prenom, email: m.email,
          telephone: m.telephone, specialite: m.specialite,
          matricule: m.matricule, horaires: m.horaires,
          faculte: isAutre ? 'Autre' : (m.faculte || ''),
          faculteAutre: isAutre ? m.faculte : '',
          disponible: m.disponible,
        });
      });
    }
    if (this.isSecretaire()) {
      this.api.medecins().subscribe(m => this.medecins = m);
      // Charger le médecin rattaché actuel depuis l'utilisateur
      this.api.utilisateur(uid).pipe(catchError(() => of(null))).subscribe((u: any) => {
        if (u?.medecinRattacheId) {
          this.form.patchValue({ medecinRattacheId: u.medecinRattacheId });
        }
      });
    }
  }

  previewMedecin(): any {
    const v = this.form.getRawValue();
    return {
      nom: v.nom, prenom: v.prenom, specialite: v.specialite,
      horaires: v.horaires, faculte: v.faculte,
      disponible: v.disponible, matricule: v.matricule,
    };
  }

  onFaculteChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.showFaculteAutre = val === 'Autre';
    if (val !== 'Autre') this.form.patchValue({ faculteAutre: '' });
  }

  addHoraire(event: Event): void {
    (event.target as HTMLSelectElement).value = '';
  }

  horairesList(): string[] {
    const h = this.form.get('horaires')?.value ?? '';
    return h ? h.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }

  removeHoraire(h: string): void {
    const list = this.horairesList().filter(x => x !== h);
    this.form.patchValue({ horaires: list.join(', ') });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errMsg = '';
    const v = this.form.getRawValue();
    const utilisateurPayload: any = {
      nom: v.nom,
      prenom: v.prenom,
      email: v.email,
      telephone: v.telephone,
      role: this.auth.role(),
      actif: true,
      medecinRattacheId: v.medecinRattacheId ?? null
    };
    if (v.motDePasse && v.motDePasse.length >= 4) utilisateurPayload.motDePasse = v.motDePasse;

    this.api.saveUtilisateur(utilisateurPayload, this.utilisateurId).subscribe({
      next: () => {
        if (this.isMedecin() && this.medecinId) {
          // Si "Autre" sélectionné, utiliser la valeur saisie manuellement
          const faculteFinale = v.faculte === 'Autre' ? (v.faculteAutre || '') : (v.faculte || '');
          this.api.saveMedecin({ nom: v.nom, prenom: v.prenom, email: v.email, telephone: v.telephone,
            specialite: v.specialite, horaires: v.horaires, faculte: faculteFinale,
            disponible: v.disponible, matricule: v.matricule }, this.medecinId).subscribe({
            next: () => this.onSaved(v),
            error: (err) => { this.errMsg = err?.error?.message || 'Erreur profil médecin.'; this.loading = false; }
          });
        } else { this.onSaved(v); }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || '';
        if (err?.status === 401 || err?.status === 403) {
          this.errMsg = 'Session expirée. Veuillez vous reconnecter.';
          setTimeout(() => this.auth.logout(), 2000);
        } else if (err?.status === 400) {
          this.errMsg = 'Données invalides : ' + msg;
        } else {
          this.errMsg = 'Erreur lors de la sauvegarde (code ' + err?.status + ') : ' + msg;
        }
        this.loading = false;
      }
    });
  }

  private onSaved(v: any): void {
    this.loading = false; this.saved = true;
    this.form.patchValue({ motDePasse: '' });
    const c = this.auth.current();
    if (c) { c.nom = v.nom; c.prenom = v.prenom; c.email = v.email; this.auth.persist(c); }
    setTimeout(() => this.saved = false, 4000);
  }

  isMedecin(): boolean { return this.auth.role() === 'MEDECIN'; }
  isSecretaire(): boolean { return this.auth.role() === 'SECRETAIRE'; }
  roleIcon(): string {
    const m: Record<string,string> = { MEDECIN:'fa fa-user-doctor', ADMIN:'fa fa-shield-halved', SECRETAIRE:'fa fa-briefcase' };
    return m[this.auth.role()??''] ?? 'fa fa-user';
  }
}
