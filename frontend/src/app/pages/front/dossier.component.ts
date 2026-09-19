import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dossier',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  template: `
    <div class="dos">

      <!-- ── CARDS INFO ──────────────────────────────── -->
      <div class="dos-infocards">
        <div class="dos-infocard reveal" style="animation-delay:.0s">
          <div class="dic-icon" style="background:#dbeafe;color:#1d4ed8"><i class="fa fa-user"></i></div>
          <div class="dic-label">Identité</div>
          <div class="dic-val">{{ form.get('nom')?.value || '—' }}, {{ form.get('prenom')?.value || '—' }}</div>
        </div>
        <div class="dos-infocard reveal" style="animation-delay:.1s">
          <div class="dic-icon" style="background:#fee2e2;color:#b91c1c"><i class="fa fa-droplet"></i></div>
          <div class="dic-label">Groupe sanguin</div>
          <div class="dic-val">{{ form.get('groupeSanguin')?.value || 'Non renseigné' }}</div>
        </div>
        <div class="dos-infocard reveal" style="animation-delay:.2s">
          <div class="dic-icon" style="background:#fef9c3;color:#854d0e"><i class="fa fa-triangle-exclamation"></i></div>
          <div class="dic-label">Allergies</div>
          <div class="dic-val">{{ form.get('allergies')?.value || 'Aucune' }}</div>
        </div>
        <div class="dos-infocard reveal" style="animation-delay:.3s">
          <div class="dic-icon" style="background:#f3e8ff;color:#7e22ce"><i class="fa fa-notes-medical"></i></div>
          <div class="dic-label">Antécédents</div>
          <div class="dic-val">{{ form.get('antecedents')?.value || 'Aucun' }}</div>
        </div>
      </div>

      <!-- ── FORM ─────────────────────────────────────── -->
      <form [formGroup]="form" (ngSubmit)="save()" class="dos-form">

        <!-- Section identité -->
        <div class="dos-section reveal" style="animation-delay:.1s">
          <div class="dos-sec-head">
            <div class="dos-sec-icon blue"><i class="fa fa-user-circle"></i></div>
            <span>Informations personnelles</span>
          </div>
          <div class="dos-grid">
            <div class="dos-field">
              <label>Nom <span class="req">*</span></label>
              <input formControlName="nom" placeholder="Dupont">
            </div>
            <div class="dos-field">
              <label>Prénom <span class="req">*</span></label>
              <input formControlName="prenom" placeholder="Marie">
            </div>
            <div class="dos-field">
              <label>Date de naissance</label>
              <input type="date" formControlName="dateNaissance">
            </div>
            <div class="dos-field">
              <label>Sexe</label>
              <select formControlName="sexe">
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
              </select>
            </div>
            <div class="dos-field">
              <label>Téléphone</label>
              <input formControlName="telephone" placeholder="06 00 00 00 00">
            </div>
            <div class="dos-field dos-span2">
              <label>Adresse</label>
              <input formControlName="adresse" placeholder="15 rue de la Paix, Alger">
            </div>
          </div>
        </div>

        <!-- Section médicale -->
        <div class="dos-section reveal" style="animation-delay:.2s">
          <div class="dos-sec-head">
            <div class="dos-sec-icon red"><i class="fa fa-heart-pulse"></i></div>
            <span>Informations médicales</span>
          </div>
          <div class="dos-grid" style="grid-template-columns:1fr 1fr 1fr">
            <div class="dos-field">
              <label>Groupe sanguin</label>
              <select formControlName="groupeSanguin">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let g of groupes" [value]="g">{{ g }}</option>
              </select>
            </div>
          </div>
          <div class="dos-grid-2" style="margin-top:16px">
            <div class="dos-field">
              <label><i class="fa fa-triangle-exclamation" style="color:#f59e0b;margin-right:5px"></i>Allergies</label>
              <textarea formControlName="allergies" placeholder="Pénicilline, arachides, latex…" rows="4"></textarea>
            </div>
            <div class="dos-field">
              <label><i class="fa fa-clock-rotate-left" style="color:#6366f1;margin-right:5px"></i>Antécédents médicaux</label>
              <textarea formControlName="antecedents" placeholder="Diabète, hypertension, chirurgie…" rows="4"></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dos-footer reveal" style="animation-delay:.3s">
          <div class="dos-hint">
            <i class="fa fa-shield-halved"></i>
            Données médicales chiffrées et sécurisées
          </div>
          <div class="dos-footer-right">
            <div class="dos-saved" *ngIf="saved">
              <i class="fa fa-circle-check"></i> Enregistré !
            </div>
            <button type="submit" class="dos-btn" [disabled]="loading">
              <span class="dos-spin" *ngIf="loading"></span>
              <i class="fa fa-floppy-disk" *ngIf="!loading"></i>
              {{ loading ? 'Enregistrement…' : 'Enregistrer mon dossier' }}
            </button>
          </div>
        </div>

        <div class="dos-error" *ngIf="errMsg">
          <i class="fa fa-triangle-exclamation"></i> {{ errMsg }}
        </div>

      </form>
    </div>
  `,
  styles: [`
    @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes popIn  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }

    .reveal { animation: fadeUp .5s ease both; }

    .dos { display:flex; flex-direction:column; gap:20px; max-width:960px; margin:0 auto; }

    /* Info cards */
    .dos-infocards { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .dos-infocard {
      background:#fff; border-radius:16px; padding:18px 16px;
      border:1.5px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,.05);
      display:flex; flex-direction:column; gap:8px; transition:all .22s;
    }
    .dos-infocard:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.09); }
    .dic-icon {
      width:40px; height:40px; border-radius:11px;
      display:flex; align-items:center; justify-content:center; font-size:17px;
    }
    .dic-label { font-size:11.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
    .dic-val   { font-size:13px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

    /* Form */
    .dos-form { display:flex; flex-direction:column; gap:16px; }

    .dos-section {
      background:#fff; border-radius:20px; padding:24px 26px;
      border:1.5px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .dos-sec-head {
      display:flex; align-items:center; gap:10px;
      font-size:15px; font-weight:800; color:#0f172a; margin-bottom:20px;
    }
    .dos-sec-icon {
      width:34px; height:34px; border-radius:9px;
      display:flex; align-items:center; justify-content:center; font-size:15px;
    }
    .dos-sec-icon.blue { background:#dbeafe; color:#1d4ed8; }
    .dos-sec-icon.red  { background:#fee2e2; color:#b91c1c; }

    .dos-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .dos-grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .dos-span2 { grid-column:span 2; }

    .dos-field { display:flex; flex-direction:column; gap:5px; }
    .dos-field label { font-size:12.5px; font-weight:700; color:#475569; }
    .req { color:#ef4444; }
    .dos-field input, .dos-field select, .dos-field textarea {
      padding:10px 13px; border-radius:11px; border:1.5px solid #e2e8f0;
      background:#f8fafc; color:#0f172a; font-size:14px; outline:none;
      transition:all .2s; font-family:inherit;
    }
    .dos-field input:focus, .dos-field select:focus, .dos-field textarea:focus {
      border-color:#0f6cbd; background:#fff; box-shadow:0 0 0 3px rgba(15,108,189,.08);
    }
    .dos-field textarea { resize:vertical; min-height:90px; }

    /* Footer */
    .dos-footer {
      display:flex; align-items:center; justify-content:space-between;
      background:#f8fafc; border-radius:14px; padding:16px 22px;
      border:1.5px solid #f1f5f9;
    }
    .dos-hint { font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:7px; }
    .dos-hint i { color:#22c55e; font-size:15px; }
    .dos-footer-right { display:flex; align-items:center; gap:14px; }
    .dos-saved {
      display:flex; align-items:center; gap:6px;
      font-size:13px; font-weight:700; color:#15803d;
      animation: popIn .3s ease;
    }
    .dos-saved i { font-size:16px; }
    .dos-btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:12px 26px; border-radius:12px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:14px; font-weight:700; transition:all .22s;
      box-shadow:0 4px 14px rgba(15,108,189,.3);
    }
    .dos-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,108,189,.4); }
    .dos-btn:disabled { opacity:.55; cursor:not-allowed; }
    .dos-spin {
      width:14px; height:14px; border-radius:50%;
      border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
      animation:spin .6s linear infinite; display:inline-block;
    }
    .dos-error {
      display:flex; align-items:center; gap:8px;
      background:#fff5f5; color:#dc2626; border:1.5px solid #fca5a5;
      border-radius:10px; padding:11px 14px; font-size:13px;
    }

    @media(max-width:768px) {
      .dos-infocards { grid-template-columns:1fr 1fr; }
      .dos-grid      { grid-template-columns:1fr 1fr; }
      .dos-span2     { grid-column:span 2; }
    }
    @media(max-width:480px) {
      .dos-infocards, .dos-grid, .dos-grid-2 { grid-template-columns:1fr; }
      .dos-span2 { grid-column:span 1; }
    }
  `]
})
export class DossierComponent implements OnInit, AfterViewInit {
  id?: number;
  errMsg = '';
  saved = false;
  loading = false;
  groupes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

  form = this.fb.group({
    nom:           ['', Validators.required],
    prenom:        ['', Validators.required],
    dateNaissance: [''],
    sexe:          ['F'],
    telephone:     [''],
    adresse:       [''],
    groupeSanguin: [''],
    allergies:     [''],
    antecedents:   ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private el: ElementRef) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.patientByUser(uid).pipe(catchError(() => of(null))).subscribe(p => {
      if (p) { this.id = p.id; this.form.patchValue(p); }
      else { this.form.patchValue({ nom: this.auth.current()?.nom || '', prenom: this.auth.current()?.prenom || '' }); }
    });
  }

  ngAfterViewInit(): void {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => this.el.nativeElement.querySelectorAll('.reveal').forEach((el: Element) => obs.observe(el)), 100);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const uid = this.auth.current()?.id;
    this.api.savePatient({ ...this.form.getRawValue(), utilisateurId: uid }, this.id).subscribe({
      next: (p: any) => {
        this.id = p.id; this.loading = false; this.saved = true;
        setTimeout(() => this.saved = false, 4000);
      },
      error: () => { this.errMsg = 'Erreur lors de la sauvegarde.'; this.loading = false; }
    });
  }
}
