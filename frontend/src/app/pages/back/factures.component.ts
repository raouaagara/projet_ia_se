import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, DecimalPipe, DatePipe],
  template: `
    <div class="fac-page">

      <!-- ── HEADER ─────────────────────────────────── -->
      <div class="fac-header">
        <div>
          <h2 class="fac-title"><i class="fa fa-file-invoice-dollar"></i> Facturation & Paiements</h2>
          <p class="fac-sub">Gestion des factures et suivi des paiements</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm" *ngIf="canEdit()">
          <i [class]="showForm ? 'fa fa-xmark' : 'fa fa-plus'"></i>
          {{ showForm ? 'Annuler' : 'Nouvelle facture' }}
        </button>
      </div>

      <!-- ── KPI ────────────────────────────────────── -->
      <div class="fac-kpis">
        <div class="fac-kpi">
          <div class="fac-kpi-icon" style="background:#dbeafe;color:#1d4ed8"><i class="fa fa-file-invoice"></i></div>
          <div><div class="fac-kpi-v">{{ items.length }}</div><div class="fac-kpi-l">Total factures</div></div>
        </div>
        <div class="fac-kpi">
          <div class="fac-kpi-icon" style="background:#dcfce7;color:#15803d"><i class="fa fa-circle-check"></i></div>
          <div><div class="fac-kpi-v">{{ count('PAYE') }}</div><div class="fac-kpi-l">Payées</div></div>
        </div>
        <div class="fac-kpi">
          <div class="fac-kpi-icon" style="background:#fef9c3;color:#854d0e"><i class="fa fa-clock"></i></div>
          <div><div class="fac-kpi-v">{{ count('EN_ATTENTE') }}</div><div class="fac-kpi-l">En attente</div></div>
        </div>
        <div class="fac-kpi">
          <div class="fac-kpi-icon" style="background:#f0fdf4;color:#166534"><i class="fa fa-coins"></i></div>
          <div><div class="fac-kpi-v">{{ totalRevenus() | number:'1.0-0' }} €</div><div class="fac-kpi-l">Revenus encaissés</div></div>
        </div>
      </div>

      <!-- ── FORMULAIRE ─────────────────────────────── -->
      <div class="fac-card" *ngIf="showForm && canEdit()">
        <div class="fac-card-head">
          <span><i class="fa fa-file-plus"></i> {{ editingId ? 'Modifier' : 'Nouvelle' }} facture</span>
          <button class="btn-ghost-sm" (click)="reset()"><i class="fa fa-xmark"></i></button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="fac-form">
          <div class="fac-row">
            <div class="fac-field">
              <label>Patient <span class="req">*</span></label>
              <select formControlName="patientId">
                <option value="">— Choisir —</option>
                <option *ngFor="let p of patients" [value]="p.id">{{ p.prenom }} {{ p.nom }}</option>
              </select>
            </div>
            <div class="fac-field">
              <label>Médecin</label>
              <select formControlName="medecinId">
                <option value="">— Optionnel —</option>
                <option *ngFor="let m of medecins" [value]="m.id">Dr {{ m.prenom }} {{ m.nom }}</option>
              </select>
            </div>
            <div class="fac-field">
              <label>Date facture</label>
              <input type="date" formControlName="dateFacture">
            </div>
          </div>

          <div class="fac-row">
            <div class="fac-field">
              <label>Montant total (€) <span class="req">*</span></label>
              <input type="number" formControlName="montantTotal" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="fac-field">
              <label>Montant payé (€)</label>
              <input type="number" formControlName="montantPaye" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="fac-field">
              <label>Statut</label>
              <select formControlName="statut">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PARTIELLEMENT_PAYE">Partiellement payé</option>
                <option value="PAYE">Payé</option>
                <option value="REMBOURSE">Remboursé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          <div class="fac-field">
            <label>Notes</label>
            <textarea formControlName="notes" rows="2" placeholder="Observations…"></textarea>
          </div>

          <div class="fac-actions">
            <button type="button" class="btn-ghost" (click)="reset()">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
              <i class="fa fa-floppy-disk"></i> {{ loading ? 'Enregistrement…' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ── FILTRE STATUT ──────────────────────────── -->
      <div class="fac-filters">
        <button class="fac-filter" [class.active]="filterStatut === ''"
                (click)="filterStatut = ''">Toutes ({{ items.length }})</button>
        <button class="fac-filter" [class.active]="filterStatut === 'EN_ATTENTE'"
                (click)="filterStatut = 'EN_ATTENTE'">
          <span class="dot dot-yellow"></span>En attente ({{ count('EN_ATTENTE') }})
        </button>
        <button class="fac-filter" [class.active]="filterStatut === 'PAYE'"
                (click)="filterStatut = 'PAYE'">
          <span class="dot dot-green"></span>Payées ({{ count('PAYE') }})
        </button>
        <button class="fac-filter" [class.active]="filterStatut === 'PARTIELLEMENT_PAYE'"
                (click)="filterStatut = 'PARTIELLEMENT_PAYE'">
          <span class="dot dot-blue"></span>Partiellement ({{ count('PARTIELLEMENT_PAYE') }})
        </button>
        <button class="fac-filter" [class.active]="filterStatut === 'REMBOURSE'"
                (click)="filterStatut = 'REMBOURSE'">
          <span class="dot dot-purple"></span>Remboursées ({{ count('REMBOURSE') }})
        </button>
      </div>

      <!-- ── TABLEAU ────────────────────────────────── -->
      <div class="fac-card">
        <div class="fac-table-wrap">
          <table class="fac-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Statut</th>
                <th *ngIf="canEdit()">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of filtered()">
                <td><span class="fac-num">{{ f.numeroFacture }}</span></td>
                <td>
                  <div class="fac-patient">
                    <div class="fac-av">{{ f.patientNom?.charAt(0) }}</div>
                    <span>{{ f.patientNom }}</span>
                  </div>
                </td>
                <td>{{ f.medecinNom || '—' }}</td>
                <td>{{ f.dateFacture | date:'dd/MM/yyyy' }}</td>
                <td class="fac-amount">{{ f.montantTotal | number:'1.2-2' }} €</td>
                <td class="fac-amount">{{ f.montantPaye | number:'1.2-2' }} €</td>
                <td><span class="fac-badge" [class]="badgeClass(f.statut)">{{ statutLabel(f.statut) }}</span></td>
                <td *ngIf="canEdit()">
                  <button class="btn-icon" title="Modifier" (click)="edit(f)"><i class="fa fa-pen"></i></button>
                  <button class="btn-icon danger" title="Supprimer" (click)="remove(f.id)" *ngIf="isAdmin()"><i class="fa fa-trash"></i></button>
                  <button class="btn-icon" title="Exporter PDF" (click)="exportPdf(f)"><i class="fa fa-file-pdf"></i></button>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td [attr.colspan]="canEdit() ? 8 : 7" class="fac-empty">
                  <i class="fa fa-file-invoice-dollar"></i><p>Aucune facture</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .fac-page { display:flex; flex-direction:column; gap:20px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    .fac-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
    .fac-title { font-size:22px; font-weight:900; color:var(--text,#0f172a); margin:0 0 4px;
      display:flex; align-items:center; gap:10px; }
    .fac-title i { color:#0f6cbd; }
    .fac-sub  { font-size:13px; color:var(--text-muted,#64748b); margin:0; }

    /* KPIs */
    .fac-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; }
    .fac-kpi {
      background:var(--surface,#fff); border-radius:14px; padding:18px 16px;
      border:1.5px solid var(--border,#e2e8f0); display:flex; align-items:center; gap:14px;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .2s;
    }
    .fac-kpi:hover { transform:translateY(-3px); }
    .fac-kpi-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center;
      justify-content:center; font-size:20px; flex-shrink:0; }
    .fac-kpi-v { font-size:24px; font-weight:900; color:var(--text,#0f172a); }
    .fac-kpi-l { font-size:12px; color:var(--text-muted,#64748b); font-weight:600; margin-top:2px; }

    /* Card */
    .fac-card {
      background:var(--surface,#fff); border-radius:16px; border:1.5px solid var(--border,#e2e8f0);
      padding:22px; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .fac-card-head {
      display:flex; align-items:center; justify-content:space-between;
      font-size:15px; font-weight:800; color:var(--text,#0f172a); margin-bottom:18px;
    }
    .fac-card-head i { color:#0f6cbd; margin-right:8px; }

    /* Form */
    .fac-form  { display:flex; flex-direction:column; gap:14px; }
    .fac-row   { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; }
    .fac-field { display:flex; flex-direction:column; gap:5px; }
    .fac-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .req { color:#ef4444; }
    .fac-field input, .fac-field select, .fac-field textarea {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px;
      outline:none; transition:border-color .2s; font-family:inherit;
    }
    .fac-field input:focus, .fac-field select:focus, .fac-field textarea:focus {
      border-color:#0f6cbd; background:#fff;
    }
    .fac-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:8px; }

    /* Filters */
    .fac-filters { display:flex; gap:8px; flex-wrap:wrap; }
    .fac-filter {
      display:flex; align-items:center; gap:6px;
      padding:7px 14px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .fac-filter:hover, .fac-filter.active { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }
    .dot { width:8px; height:8px; border-radius:50%; }
    .dot-green  { background:#22c55e; }
    .dot-yellow { background:#f59e0b; }
    .dot-blue   { background:#3b82f6; }
    .dot-purple { background:#9333ea; }

    /* Table */
    .fac-table-wrap { overflow-x:auto; }
    .fac-table { width:100%; border-collapse:collapse; font-size:13.5px; }
    .fac-table th {
      padding:12px 14px; text-align:left; font-size:11.5px; font-weight:800;
      color:var(--text-muted,#64748b); text-transform:uppercase; letter-spacing:.05em;
      background:var(--bg,#f8fafc); border-bottom:1.5px solid var(--border,#e2e8f0);
    }
    .fac-table td { padding:12px 14px; border-bottom:1px solid var(--border,#f1f5f9); vertical-align:middle; }
    .fac-table tr:hover td { background:var(--bg,#f8fafc); }
    .fac-num { font-weight:700; color:#0f6cbd; font-size:12px; }
    .fac-patient { display:flex; align-items:center; gap:8px; }
    .fac-av {
      width:32px; height:32px; border-radius:9px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .fac-amount { font-weight:700; color:var(--text,#0f172a); }
    .fac-empty { text-align:center; padding:36px; color:var(--text-muted,#94a3b8); }
    .fac-empty i { font-size:32px; display:block; margin-bottom:8px; }
    .fac-empty p { margin:0; font-size:13px; }

    /* Badges */
    .fac-badge { padding:4px 11px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .badge-en_attente     { background:#fef9c3; color:#854d0e; }
    .badge-paye           { background:#dcfce7; color:#15803d; }
    .badge-partiellement_paye { background:#dbeafe; color:#1d4ed8; }
    .badge-rembourse      { background:#f3e8ff; color:#7e22ce; }
    .badge-annule         { background:#fee2e2; color:#b91c1c; }

    /* Buttons */
    .btn-primary {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:13.5px; font-weight:700; transition:all .2s;
    }
    .btn-primary:hover:not(:disabled) { transform:translateY(-2px); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost { padding:10px 20px; border-radius:11px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b); font-size:13.5px;
      font-weight:600; cursor:pointer; transition:all .18s; }
    .btn-ghost:hover { background:#f0f9ff; border-color:#bfdbfe; color:#0f6cbd; }
    .btn-ghost-sm { background:none; border:none; cursor:pointer; color:var(--text-muted,#94a3b8);
      font-size:14px; padding:4px 8px; border-radius:6px; transition:all .15s; }
    .btn-ghost-sm:hover { color:#ef4444; }
    .btn-icon { background:none; border:1.5px solid var(--border,#e2e8f0); border-radius:7px;
      padding:5px 8px; cursor:pointer; color:var(--text-muted,#64748b); font-size:12px;
      margin-right:4px; transition:all .15s; }
    .btn-icon:hover { background:#f0f9ff; color:#0f6cbd; border-color:#bfdbfe; }
    .btn-icon.danger:hover { background:#fff5f5; color:#ef4444; border-color:#fca5a5; }
  `]
})
export class FacturesComponent implements OnInit {
  items: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  editingId?: number;
  showForm = false;
  loading = false;
  filterStatut = '';

  form = this.fb.group({
    patientId:    [null as number | null, Validators.required],
    medecinId:    [null as number | null],
    dateFacture:  [''],
    montantTotal: [null as number | null, [Validators.required, Validators.min(0)]],
    montantPaye:  [0],
    statut:       ['EN_ATTENTE'],
    notes:        ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.load();
    this.api.patients().subscribe(p => this.patients = p);
    this.api.medecins().subscribe(m => this.medecins = m);
  }

  load(): void { this.api.factures().subscribe(d => this.items = d); }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      ...v,
      patientId: +v.patientId!,
      medecinId: v.medecinId ? +v.medecinId : null
    };
    this.api.saveFacture(body, this.editingId).subscribe({
      next: () => { this.reset(); this.load(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  edit(f: any): void {
    this.editingId = f.id;
    this.showForm = true;
    this.form.patchValue({
      patientId: f.patientId, medecinId: f.medecinId,
      dateFacture: f.dateFacture, montantTotal: f.montantTotal,
      montantPaye: f.montantPaye, statut: f.statut, notes: f.notes
    });
  }

  reset(): void {
    this.editingId = undefined;
    this.showForm = false;
    this.form.reset({ statut: 'EN_ATTENTE', montantPaye: 0 });
  }

  remove(id: number): void {
    if (confirm('Supprimer cette facture ?')) {
      this.api.deleteFacture(id).subscribe(() => this.load());
    }
  }

  exportPdf(f: any): void {
    const content = `
FACTURE N° ${f.numeroFacture}
Date : ${f.dateFacture}
Patient : ${f.patientNom}
Médecin : ${f.medecinNom || 'N/A'}
──────────────────────────────
Montant total : ${f.montantTotal} €
Montant payé  : ${f.montantPaye} €
Statut        : ${this.statutLabel(f.statut)}
──────────────────────────────
Notes : ${f.notes || 'Aucune'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `facture-${f.numeroFacture}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  filtered(): any[] {
    if (!this.filterStatut) return this.items;
    return this.items.filter(f => f.statut === this.filterStatut);
  }

  count(statut: string): number { return this.items.filter(f => f.statut === statut).length; }

  totalRevenus(): number {
    return this.items
      .filter(f => f.statut === 'PAYE')
      .reduce((sum, f) => sum + (f.montantPaye || 0), 0);
  }

  badgeClass(s: string): string { return 'fac-badge badge-' + (s || '').toLowerCase(); }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', PAYE: 'Payé',
      PARTIELLEMENT_PAYE: 'Partiel', REMBOURSE: 'Remboursé', ANNULE: 'Annulé'
    };
    return map[s] ?? s;
  }

  canEdit(): boolean { return this.auth.role() === 'ADMIN' || this.auth.role() === 'SECRETAIRE'; }
  isAdmin(): boolean { return this.auth.role() === 'ADMIN'; }
}
