import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-examens',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, DatePipe, SlicePipe],
  template: `
    <div class="ex-page">

      <!-- HEADER -->
      <div class="ex-header">
        <div>
          <h2 class="ex-title"><i class="fa fa-flask"></i> Examens & Laboratoire</h2>
          <p class="ex-sub">Demandes d'analyses et résultats</p>
        </div>
        <button class="ex-btn-primary" (click)="showForm=!showForm" *ngIf="isMedecin()">
          <i [class]="showForm?'fa fa-xmark':'fa fa-plus'"></i>
          {{ showForm ? 'Annuler' : 'Nouvelle demande' }}
        </button>
      </div>

      <!-- STATS -->
      <div class="ex-stats">
        <div class="ex-stat" *ngFor="let s of statCards">
          <div class="ex-stat-icon" [style.background]="s.bg" [style.color]="s.color">
            <i [class]="'fa '+s.icon"></i>
          </div>
          <div>
            <div class="ex-stat-v">{{ s.value }}</div>
            <div class="ex-stat-l">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- FORM NOUVELLE DEMANDE -->
      <div class="ex-form-card" *ngIf="showForm">
        <div class="ex-form-head"><i class="fa fa-flask"></i> Nouvelle demande d'examen</div>
        <form [formGroup]="form" (ngSubmit)="save()" class="ex-form-body">
          <div class="ex-form-row">
            <div class="ex-field">
              <label>Patient <span class="req">*</span></label>
              <select formControlName="patientId">
                <option [ngValue]="null">— Choisir —</option>
                <option *ngFor="let p of patients" [ngValue]="p.id">{{ p.prenom }} {{ p.nom }}</option>
              </select>
            </div>
            <div class="ex-field">
              <label>Type d'examen <span class="req">*</span></label>
              <select formControlName="typeExamen">
                <option value="">— Choisir —</option>
                <option *ngFor="let t of typesExamen" [value]="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="ex-field">
            <label>Instructions / Description</label>
            <textarea formControlName="description" placeholder="Précisions pour le laboratoire…" rows="3"></textarea>
          </div>
          <div class="ex-form-actions">
            <button type="button" class="ex-btn-ghost" (click)="showForm=false">Annuler</button>
            <button type="submit" class="ex-btn-primary" [disabled]="form.invalid || loading">
              <i class="fa fa-paper-plane"></i> Envoyer la demande
            </button>
          </div>
        </form>
      </div>

      <!-- MODAL RÉSULTAT -->
      <div class="ex-overlay" *ngIf="examenResultat" (click)="examenResultat=null"></div>
      <div class="ex-modal" *ngIf="examenResultat">
        <div class="ex-modal-head">
          <span>Saisir résultat — {{ examenResultat.typeExamen }}</span>
          <button (click)="examenResultat=null"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="ex-modal-body">
          <div class="ex-field">
            <label>Résultat (texte)</label>
            <textarea [(ngModel)]="resultatTexte" rows="5" placeholder="Valeurs, observations, conclusions…"></textarea>
          </div>
          <div class="ex-modal-footer">
            <button class="ex-btn-ghost" (click)="examenResultat=null">Annuler</button>
            <button class="ex-btn-primary" (click)="saisirResultat()">
              <i class="fa fa-check"></i> Valider le résultat
            </button>
          </div>
        </div>
      </div>

      <!-- LISTE -->
      <div class="ex-list">
        <!-- Skeleton -->
        <div class="ex-sk" *ngFor="let x of [1,2,3]" [style.display]="loading?'block':'none'"></div>

        <!-- Empty -->
        <div class="ex-empty" *ngIf="!loading && examens.length===0">
          <i class="fa fa-flask"></i><p>Aucun examen enregistré</p>
        </div>

        <!-- Cards -->
        <div class="ex-card" *ngFor="let e of examens">
          <div class="ex-card-left" [class]="statusColor(e.statut)">
            <i class="fa fa-flask"></i>
            <span class="ex-card-date">{{ e.dateDemande | date:'dd/MM' }}</span>
          </div>
          <div class="ex-card-body">
            <div class="ex-card-type">{{ e.typeExamen }}</div>
            <div class="ex-card-info">
              <span><i class="fa fa-user"></i> {{ e.patientNom }}</span>
              <span><i class="fa fa-user-doctor"></i> {{ e.medecinNom }}</span>
              <span *ngIf="e.description"><i class="fa fa-notes-medical"></i> {{ e.description }}</span>
            </div>
            <div class="ex-result" *ngIf="e.resultatTexte">
              <i class="fa fa-microscope"></i> {{ e.resultatTexte | slice:0:120 }}{{ e.resultatTexte.length>120?'…':'' }}
            </div>
          </div>
          <div class="ex-card-right">
            <span class="ex-badge" [class]="badgeClass(e.statut)">{{ statutLabel(e.statut) }}</span>
            <div class="ex-card-actions">
              <button class="ex-act-btn" (click)="openResultat(e)"
                *ngIf="e.statut!=='RESULTAT_DISPONIBLE' && (isMedecin() || isAdmin())"
                title="Saisir résultat">
                <i class="fa fa-microscope"></i>
              </button>
              <button class="ex-act-btn del" (click)="remove(e.id)"
                *ngIf="isAdmin() || isMedecin()" title="Supprimer">
                <i class="fa fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .ex-page { display:flex; flex-direction:column; gap:20px; }
    .ex-header { display:flex; align-items:center; justify-content:space-between; }
    .ex-title  { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 4px; }
    .ex-title i{ color:#7e22ce; margin-right:8px; }
    .ex-sub    { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .req { color:#ef4444; }

    .ex-btn-primary {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#7e22ce,#a855f7); color:#fff;
      font-size:13.5px; font-weight:700; transition:all .2s;
      box-shadow:0 4px 14px rgba(126,34,206,.3);
    }
    .ex-btn-primary:hover:not(:disabled) { transform:translateY(-2px); }
    .ex-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
    .ex-btn-ghost {
      display:inline-flex; align-items:center; gap:7px;
      padding:9px 18px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .ex-btn-ghost:hover { background:var(--bg,#f0f4f8); }

    /* Stats */
    .ex-stats { display:flex; gap:14px; flex-wrap:wrap; }
    .ex-stat {
      flex:1; min-width:140px; background:var(--surface,#fff); border-radius:14px;
      padding:14px 18px; border:1.5px solid var(--border,#e2e8f0);
      display:flex; align-items:center; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .ex-stat-icon {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:16px;
    }
    .ex-stat-v { font-size:20px; font-weight:900; color:var(--text,#0f172a); line-height:1; }
    .ex-stat-l { font-size:12px; color:var(--text-muted,#64748b); margin-top:2px; }

    /* Form */
    .ex-form-card {
      background:var(--surface,#fff); border-radius:16px; border:1.5px solid var(--border,#e2e8f0);
      overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,.07);
      animation:slideDown .25s ease;
    }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    .ex-form-head {
      padding:14px 20px; background:linear-gradient(135deg,#faf5ff,#f3e8ff);
      font-size:14px; font-weight:800; color:#0f172a;
      display:flex; align-items:center; gap:8px; border-bottom:1.5px solid #e2e8f0;
    }
    .ex-form-head i { color:#7e22ce; }
    .ex-form-body { padding:20px; display:flex; flex-direction:column; gap:14px; }
    .ex-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .ex-field { display:flex; flex-direction:column; gap:5px; }
    .ex-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .ex-field input, .ex-field select, .ex-field textarea {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px; outline:none;
      transition:border-color .2s; font-family:inherit;
    }
    .ex-field input:focus, .ex-field select:focus, .ex-field textarea:focus {
      border-color:#7e22ce; background:#fff;
    }
    .ex-field textarea { resize:vertical; min-height:80px; }
    .ex-form-actions { display:flex; gap:10px; justify-content:flex-end; }

    /* List */
    .ex-list { display:flex; flex-direction:column; gap:10px; }
    .ex-sk {
      height:80px; border-radius:14px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .ex-empty { text-align:center; padding:52px; color:var(--text-muted,#94a3b8); }
    .ex-empty i { font-size:40px; display:block; margin-bottom:12px; }

    .ex-card {
      display:flex; align-items:stretch;
      background:var(--surface,#fff); border-radius:16px; overflow:hidden;
      border:1.5px solid var(--border,#e2e8f0); box-shadow:0 2px 8px rgba(0,0,0,.04);
      transition:all .2s;
    }
    .ex-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.09); }

    .ex-card-left {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      width:64px; flex-shrink:0; gap:4px; font-size:20px;
    }
    .ex-card-left.color-purple { background:linear-gradient(160deg,#7e22ce,#a855f7); color:#fff; }
    .ex-card-left.color-blue   { background:linear-gradient(160deg,#0f6cbd,#0a9fd4); color:#fff; }
    .ex-card-left.color-green  { background:linear-gradient(160deg,#00b389,#22c55e); color:#fff; }
    .ex-card-left.color-gray   { background:linear-gradient(160deg,#94a3b8,#64748b); color:#fff; }

    .ex-card-date { font-size:10px; font-weight:700; color:rgba(255,255,255,.8); }
    .ex-card-body { flex:1; padding:14px 18px; display:flex; flex-direction:column; gap:6px; }
    .ex-card-type { font-size:15px; font-weight:800; color:var(--text,#0f172a); }
    .ex-card-info { display:flex; gap:16px; flex-wrap:wrap; }
    .ex-card-info span { font-size:12.5px; color:var(--text-muted,#64748b); display:flex; align-items:center; gap:5px; }
    .ex-result {
      font-size:13px; color:#475569; background:var(--bg,#f8fafc);
      border-radius:8px; padding:8px 12px; border-left:3px solid #7e22ce;
    }

    .ex-card-right { display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; padding:14px 16px; }
    .ex-badge { padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:700; }
    .badge-demande           { background:#f3e8ff; color:#7e22ce; }
    .badge-en_cours          { background:#dbeafe; color:#1d4ed8; }
    .badge-resultat_disponible { background:#dcfce7; color:#15803d; }
    .badge-annule            { background:#fee2e2; color:#b91c1c; }

    .ex-card-actions { display:flex; gap:6px; }
    .ex-act-btn {
      width:30px; height:30px; border-radius:8px; border:none; cursor:pointer;
      background:#f3e8ff; color:#7e22ce; font-size:12px;
      display:flex; align-items:center; justify-content:center; transition:all .15s;
    }
    .ex-act-btn:hover { background:#7e22ce; color:#fff; }
    .ex-act-btn.del  { background:#fee2e2; color:#b91c1c; }
    .ex-act-btn.del:hover { background:#b91c1c; color:#fff; }

    /* Modal */
    .ex-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:100; }
    .ex-modal {
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      width:min(480px,calc(100vw - 32px)); background:var(--surface,#fff);
      border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 20px 56px rgba(0,0,0,.2); z-index:101;
      animation:slideDown .25s ease;
    }
    .ex-modal-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 20px; border-bottom:1.5px solid var(--border,#e2e8f0);
      font-size:15px; font-weight:800; color:var(--text,#0f172a);
    }
    .ex-modal-head button { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px; }
    .ex-modal-body { padding:20px; display:flex; flex-direction:column; gap:14px; }
    .ex-modal-footer { display:flex; gap:10px; justify-content:flex-end; }
  `]
})
export class ExamensComponent implements OnInit {
  examens: any[] = [];
  patients: any[] = [];
  loading = false;
  showForm = false;
  examenResultat: any = null;
  resultatTexte = '';
  medecinId?: number;

  statCards: any[] = [];

  typesExamen = [
    'Numération Formule Sanguine (NFS)', 'Glycémie à jeun', 'Cholestérol total',
    'Créatinine / Urée', 'Transaminases (SGOT/SGPT)', 'Thyroïde (TSH)',
    'Groupe sanguin / Rhésus', 'Ionogramme', 'Bilan lipidique',
    'CRP (Protéine C réactive)', 'Examen cytobactériologique (ECBU)',
    'Electrocardiogramme (ECG)', 'Radiographie thoracique', 'Échographie abdominale',
    'IRM', 'Scanner (TDM)', 'Sérologie (HIV, Hépatite...)', 'Autre'
  ];

  form = this.fb.group({
    patientId:   [null as number | null, Validators.required],
    typeExamen:  ['', Validators.required],
    description: [''],
  });

  constructor(private fb: FormBuilder, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadData();
    this.api.patients().subscribe(p => this.patients = p);
  }

  loadData(): void {
    if (this.isMedecin()) {
      const uid = this.auth.current()?.id;
      if (!uid) return;
      this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
        if (!m) return;
        this.medecinId = m.id;
        this.api.examensMedecin(m.id).subscribe(e => { this.examens = e; this.buildStats(); });
      });
    } else {
      this.api.examens().subscribe(e => { this.examens = e; this.buildStats(); });
    }
  }

  buildStats(): void {
    const demandes  = this.examens.filter(e => e.statut === 'DEMANDE').length;
    const enCours   = this.examens.filter(e => e.statut === 'EN_COURS').length;
    const resultats = this.examens.filter(e => e.statut === 'RESULTAT_DISPONIBLE').length;
    this.statCards = [
      { label:'Total', value:this.examens.length, icon:'fa-flask', bg:'#f3e8ff', color:'#7e22ce' },
      { label:'Demandés', value:demandes, icon:'fa-hourglass-start', bg:'#dbeafe', color:'#1d4ed8' },
      { label:'En cours', value:enCours, icon:'fa-spinner', bg:'#fff7ed', color:'#c2410c' },
      { label:'Résultats dispo', value:resultats, icon:'fa-microscope', bg:'#dcfce7', color:'#15803d' },
    ];
  }

  save(): void {
    if (this.form.invalid || !this.medecinId) return;
    this.loading = true;
    const v = this.form.getRawValue();
    this.api.saveExamen({ ...v, medecinId: this.medecinId }).subscribe({
      next: () => { this.loadData(); this.showForm = false; this.loading = false; this.form.reset(); },
      error: () => this.loading = false
    });
  }

  openResultat(e: any): void { this.examenResultat = e; this.resultatTexte = ''; }

  saisirResultat(): void {
    if (!this.examenResultat) return;
    this.api.saisirResultatExamen(this.examenResultat.id, this.resultatTexte).subscribe(() => {
      this.loadData(); this.examenResultat = null;
    });
  }

  remove(id: number): void {
    if (!confirm('Supprimer cet examen ?')) return;
    this.api.deleteExamen(id).subscribe(() => this.loadData());
  }

  isMedecin(): boolean { return this.auth.role() === 'MEDECIN'; }
  isAdmin():   boolean { return this.auth.role() === 'ADMIN'; }

  statusColor(s: string): string {
    const m: Record<string,string> = {
      DEMANDE:'color-purple', EN_COURS:'color-blue', RESULTAT_DISPONIBLE:'color-green', ANNULE:'color-gray'
    };
    return m[s] ?? 'color-purple';
  }
  badgeClass(s: string): string { return 'ex-badge badge-' + (s || '').toLowerCase(); }
  statutLabel(s: string): string {
    const m: Record<string,string> = {
      DEMANDE:'Demandé', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Résultat dispo', ANNULE:'Annulé'
    };
    return m[s] ?? s;
  }
}
