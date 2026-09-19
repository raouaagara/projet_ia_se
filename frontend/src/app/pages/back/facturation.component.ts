import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-facturation',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, DecimalPipe, DatePipe],
  template: `
    <div class="fac-page">

      <!-- ── HEADER ─────────────────────────────── -->
      <div class="fac-header">
        <div>
          <h2 class="fac-title"><i class="fa fa-file-invoice-dollar"></i> Facturation</h2>
          <p class="fac-sub">Gestion des factures et paiements</p>
        </div>
        <button class="fac-btn-primary" (click)="showForm=!showForm">
          <i [class]="showForm ? 'fa fa-xmark' : 'fa fa-plus'"></i>
          {{ showForm ? 'Annuler' : 'Nouvelle facture' }}
        </button>
      </div>

      <!-- ── STATS ──────────────────────────────── -->
      <div class="fac-stats" *ngIf="stats">
        <div class="fac-stat">
          <div class="fac-stat-icon" style="background:#dcfce7;color:#15803d"><i class="fa fa-circle-check"></i></div>
          <div><div class="fac-stat-v">{{ stats.revenusTotal | number:'1.0-0' }} DA</div><div class="fac-stat-l">Revenus total</div></div>
        </div>
        <div class="fac-stat">
          <div class="fac-stat-icon" style="background:#dbeafe;color:#1d4ed8"><i class="fa fa-file-invoice"></i></div>
          <div><div class="fac-stat-v">{{ stats.total }}</div><div class="fac-stat-l">Factures</div></div>
        </div>
        <div class="fac-stat">
          <div class="fac-stat-icon" style="background:#dcfce7;color:#15803d"><i class="fa fa-check"></i></div>
          <div><div class="fac-stat-v">{{ stats.facturesPayees }}</div><div class="fac-stat-l">Payées</div></div>
        </div>
        <div class="fac-stat">
          <div class="fac-stat-icon" style="background:#fef9c3;color:#854d0e"><i class="fa fa-clock"></i></div>
          <div><div class="fac-stat-v">{{ stats.facturesImpayees }}</div><div class="fac-stat-l">En attente</div></div>
        </div>
      </div>

      <!-- ── FORMULAIRE ─────────────────────────── -->
      <div class="fac-form-card" *ngIf="showForm">
        <div class="fac-form-head">
          <i class="fa fa-file-invoice-dollar"></i> Nouvelle facture
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="fac-form-body">
          <div class="fac-form-row">
            <div class="fac-field">
              <label>Patient <span class="req">*</span></label>
              <select formControlName="patientId">
                <option [ngValue]="null">— Choisir —</option>
                <option *ngFor="let p of patients" [ngValue]="p.id">{{ p.prenom }} {{ p.nom }}</option>
              </select>
            </div>
            <div class="fac-field">
              <label>Médecin</label>
              <select formControlName="medecinId">
                <option [ngValue]="null">— Choisir —</option>
                <option *ngFor="let m of medecins" [ngValue]="m.id">Dr {{ m.prenom }} {{ m.nom }}</option>
              </select>
            </div>
            <div class="fac-field">
              <label>Date</label>
              <input type="date" formControlName="dateFacture">
            </div>
          </div>
          <!-- Lignes -->
          <div class="fac-lignes-head">
            <span>Lignes de facturation</span>
            <button type="button" class="fac-btn-ghost" (click)="addLigne()">
              <i class="fa fa-plus"></i> Ajouter ligne
            </button>
          </div>
          <div class="fac-ligne" *ngFor="let l of lignes; let i=index">
            <input [(ngModel)]="l.description" [ngModelOptions]="{standalone:true}" placeholder="Description" class="fac-ligne-desc">
            <input [(ngModel)]="l.quantite"    [ngModelOptions]="{standalone:true}" type="number" min="1" placeholder="Qté" class="fac-ligne-qty" (input)="calcTotal()">
            <input [(ngModel)]="l.prixUnitaire"[ngModelOptions]="{standalone:true}" type="number" min="0" placeholder="Prix" class="fac-ligne-prix" (input)="calcTotal()">
            <span class="fac-ligne-total">{{ (l.quantite * l.prixUnitaire) || 0 | number:'1.0-0' }} DA</span>
            <button type="button" (click)="removeLigne(i)"><i class="fa fa-xmark"></i></button>
          </div>
          <div class="fac-total-row">
            <span>Total :</span>
            <strong>{{ totalCalcule | number:'1.0-0' }} DA</strong>
          </div>
          <div class="fac-field" style="margin-top:8px">
            <label>Notes</label>
            <input formControlName="notes" placeholder="Notes optionnelles">
          </div>
          <div class="fac-form-actions">
            <button type="button" class="fac-btn-ghost" (click)="showForm=false">Annuler</button>
            <button type="submit" class="fac-btn-primary" [disabled]="form.invalid || loading">
              <i class="fa fa-floppy-disk"></i> Créer la facture
            </button>
          </div>
        </form>
      </div>

      <!-- ── LISTE ──────────────────────────────── -->
      <div class="fac-table-card">
        <div class="fac-table-head">
          <span>{{ factures.length }} factures</span>
          <div class="fac-filter-btns">
            <button *ngFor="let f of filtres" [class.active]="filtreActif===f.val" (click)="setFiltre(f.val)">{{ f.label }}</button>
          </div>
        </div>
        <table class="fac-table">
          <thead><tr>
            <th>N° Facture</th><th>Patient</th><th>Médecin</th><th>Date</th>
            <th>Montant</th><th>Payé</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let f of facturesFiltrees()" class="fac-row">
              <td class="fac-num">{{ f.numeroFacture }}</td>
              <td>{{ f.patientNom }}</td>
              <td>{{ f.medecinNom || '—' }}</td>
              <td>{{ f.dateFacture | date:'dd/MM/yyyy' }}</td>
              <td class="fac-montant">{{ f.montantTotal | number:'1.0-0' }} DA</td>
              <td>{{ f.montantPaye | number:'1.0-0' }} DA</td>
              <td><span class="fac-badge" [class]="badgeClass(f.statut)">{{ statutLabel(f.statut) }}</span></td>
              <td>
                <div class="fac-actions">
                  <button class="fac-act-btn" (click)="openPaiement(f)" title="Paiement">
                    <i class="fa fa-credit-card"></i>
                  </button>
                  <button class="fac-act-btn del" (click)="remove(f.id)" title="Supprimer">
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="factures.length===0">
              <td colspan="8" class="fac-empty"><i class="fa fa-file-invoice"></i> Aucune facture</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── MODAL PAIEMENT ─────────────────────── -->
      <div class="fac-overlay" *ngIf="factureSelectee" (click)="factureSelectee=null"></div>
      <div class="fac-modal" *ngIf="factureSelectee">
        <div class="fac-modal-head">
          <span>Enregistrer un paiement — {{ factureSelectee.numeroFacture }}</span>
          <button (click)="factureSelectee=null"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="fac-modal-body">
          <div class="fac-modal-info">
            <span>Montant total : <strong>{{ factureSelectee.montantTotal | number:'1.0-0' }} DA</strong></span>
            <span>Déjà payé : <strong>{{ factureSelectee.montantPaye | number:'1.0-0' }} DA</strong></span>
            <span>Reste : <strong>{{ (factureSelectee.montantTotal - factureSelectee.montantPaye) | number:'1.0-0' }} DA</strong></span>
          </div>
          <div class="fac-field">
            <label>Montant payé</label>
            <input type="number" [(ngModel)]="montantPaiement" [max]="factureSelectee.montantTotal">
          </div>
          <div class="fac-field">
            <label>Statut</label>
            <select [(ngModel)]="statutPaiement">
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYE">Payé</option>
              <option value="PARTIELLEMENT_PAYE">Partiellement payé</option>
              <option value="REMBOURSE">Remboursé</option>
            </select>
          </div>
          <div class="fac-modal-footer">
            <button class="fac-btn-ghost" (click)="factureSelectee=null">Annuler</button>
            <button class="fac-btn-primary" (click)="enregistrerPaiement()">
              <i class="fa fa-check"></i> Enregistrer
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .fac-page { display:flex; flex-direction:column; gap:20px; }
    .fac-header { display:flex; align-items:center; justify-content:space-between; }
    .fac-title  { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 4px; }
    .fac-title i{ color:#0f6cbd; margin-right:8px; }
    .fac-sub    { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .req { color:#ef4444; }

    /* Buttons */
    .fac-btn-primary {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:13.5px; font-weight:700; transition:all .2s;
      box-shadow:0 4px 14px rgba(15,108,189,.3);
    }
    .fac-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,108,189,.4); }
    .fac-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
    .fac-btn-ghost {
      display:inline-flex; align-items:center; gap:7px;
      padding:9px 18px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .fac-btn-ghost:hover { background:var(--bg,#f0f4f8); }

    /* Stats */
    .fac-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .fac-stat {
      background:var(--surface,#fff); border-radius:14px; padding:16px 18px;
      border:1.5px solid var(--border,#e2e8f0); display:flex; align-items:center; gap:14px;
      box-shadow:0 2px 8px rgba(0,0,0,.05); transition:all .2s;
    }
    .fac-stat:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }
    .fac-stat-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:18px;
    }
    .fac-stat-v { font-size:20px; font-weight:900; color:var(--text,#0f172a); }
    .fac-stat-l { font-size:12px; color:var(--text-muted,#64748b); font-weight:500; }

    /* Form */
    .fac-form-card {
      background:var(--surface,#fff); border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08);
      animation:slideDown .25s ease;
    }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    .fac-form-head {
      padding:16px 22px; background:linear-gradient(135deg,#f0f9ff,#e6faf5);
      font-size:15px; font-weight:800; color:#0f172a; border-bottom:1.5px solid #e2e8f0;
      display:flex; align-items:center; gap:9px;
    }
    .fac-form-head i { color:#0f6cbd; }
    .fac-form-body { padding:22px; display:flex; flex-direction:column; gap:16px; }
    .fac-form-row  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
    .fac-field     { display:flex; flex-direction:column; gap:5px; }
    .fac-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .fac-field input, .fac-field select {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px; outline:none;
      transition:border-color .2s;
    }
    .fac-field input:focus, .fac-field select:focus { border-color:#0f6cbd; background:#fff; }

    /* Lignes */
    .fac-lignes-head {
      display:flex; align-items:center; justify-content:space-between;
      font-size:13px; font-weight:700; color:var(--text,#0f172a);
    }
    .fac-ligne {
      display:flex; align-items:center; gap:8px;
      background:var(--bg,#f8fafc); border-radius:10px; padding:10px 12px;
      border:1px solid var(--border,#f1f5f9);
    }
    .fac-ligne-desc  { flex:1; }
    .fac-ligne-qty   { width:70px; }
    .fac-ligne-prix  { width:100px; }
    .fac-ligne-total { font-size:13.5px; font-weight:800; color:#0f6cbd; width:90px; text-align:right; }
    .fac-ligne input {
      padding:7px 10px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0);
      background:#fff; color:var(--text,#0f172a); font-size:13px; outline:none; width:100%;
    }
    .fac-ligne button {
      background:none; border:none; cursor:pointer; color:#94a3b8; font-size:14px;
      padding:4px; border-radius:6px; transition:all .15s;
    }
    .fac-ligne button:hover { background:#fee2e2; color:#dc2626; }
    .fac-total-row {
      display:flex; align-items:center; justify-content:flex-end; gap:12px;
      font-size:15px; padding:12px 0; border-top:1.5px solid var(--border,#f1f5f9);
    }
    .fac-total-row strong { font-size:20px; font-weight:900; color:#0f6cbd; }
    .fac-form-actions { display:flex; gap:10px; justify-content:flex-end; }

    /* Table */
    .fac-table-card {
      background:var(--surface,#fff); border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .fac-table-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 20px; border-bottom:1.5px solid var(--border,#f1f5f9);
      font-size:14px; font-weight:700; color:var(--text,#0f172a);
    }
    .fac-filter-btns { display:flex; gap:4px; }
    .fac-filter-btns button {
      padding:5px 12px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0);
      background:transparent; color:var(--text-muted,#64748b); font-size:12px; font-weight:600; cursor:pointer;
    }
    .fac-filter-btns button.active { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }

    .fac-table { width:100%; border-collapse:collapse; font-size:13.5px; }
    .fac-table thead tr { border-bottom:2px solid var(--border,#e2e8f0); }
    .fac-table th {
      padding:11px 14px; text-align:left; font-size:11px; font-weight:800;
      text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted,#94a3b8);
    }
    .fac-row { border-bottom:1px solid var(--border,#f1f5f9); transition:background .15s; }
    .fac-row:hover { background:var(--bg,#f8fafc); }
    .fac-table td { padding:12px 14px; vertical-align:middle; }
    .fac-num     { font-weight:700; color:#0f6cbd; font-family:monospace; }
    .fac-montant { font-weight:800; color:var(--text,#0f172a); }

    .fac-badge { padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:700; }
    .badge-en_attente       { background:#fef9c3; color:#854d0e; }
    .badge-paye             { background:#dcfce7; color:#15803d; }
    .badge-partiellement_paye { background:#dbeafe; color:#1d4ed8; }
    .badge-rembourse        { background:#f3e8ff; color:#7e22ce; }
    .badge-annule           { background:#fee2e2; color:#b91c1c; }

    .fac-actions { display:flex; gap:6px; }
    .fac-act-btn {
      width:30px; height:30px; border-radius:8px; border:none; cursor:pointer;
      background:#dbeafe; color:#1d4ed8; font-size:13px;
      display:flex; align-items:center; justify-content:center; transition:all .15s;
    }
    .fac-act-btn:hover { background:#1d4ed8; color:#fff; }
    .fac-act-btn.del  { background:#fee2e2; color:#b91c1c; }
    .fac-act-btn.del:hover { background:#b91c1c; color:#fff; }
    .fac-empty { text-align:center; padding:40px; color:var(--text-muted,#94a3b8); }

    /* Modal */
    .fac-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.4); backdrop-filter:blur(3px); z-index:100;
    }
    .fac-modal {
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      width:min(440px,calc(100vw - 32px)); background:var(--surface,#fff);
      border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 20px 56px rgba(0,0,0,.2); z-index:101;
      animation:slideDown .25s ease;
    }
    .fac-modal-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 20px; border-bottom:1.5px solid var(--border,#e2e8f0);
      font-size:15px; font-weight:800; color:var(--text,#0f172a);
    }
    .fac-modal-head button { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px; }
    .fac-modal-body { padding:20px; display:flex; flex-direction:column; gap:14px; }
    .fac-modal-info { display:flex; flex-direction:column; gap:6px; }
    .fac-modal-info span { font-size:13.5px; color:var(--text-muted,#64748b); }
    .fac-modal-info strong { color:var(--text,#0f172a); }
    .fac-modal-footer { display:flex; gap:10px; justify-content:flex-end; margin-top:4px; }

    @media(max-width:700px) {
      .fac-stats { grid-template-columns:1fr 1fr; }
      .fac-form-row { grid-template-columns:1fr; }
    }
  `]
})
export class FacturationComponent implements OnInit {
  factures: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  stats: any = null;
  showForm = false;
  loading = false;
  factureSelectee: any = null;
  montantPaiement = 0;
  statutPaiement = 'PAYE';
  filtreActif = '';
  totalCalcule = 0;

  lignes: { description: string; quantite: number; prixUnitaire: number }[] = [
    { description: '', quantite: 1, prixUnitaire: 0 }
  ];

  filtres = [
    { label: 'Toutes', val: '' },
    { label: 'En attente', val: 'EN_ATTENTE' },
    { label: 'Payées', val: 'PAYE' },
    { label: 'Partielles', val: 'PARTIELLEMENT_PAYE' },
  ];

  form = this.fb.group({
    patientId:   [null as number | null, Validators.required],
    medecinId:   [null as number | null],
    dateFacture: [''],
    notes:       ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.load();
    this.api.patients().subscribe(p => this.patients = p);
    this.api.medecins().subscribe(m => this.medecins = m);
    this.api.factureStats().subscribe(s => this.stats = s);
  }

  load(): void { this.api.factures().subscribe(f => this.factures = f); }

  addLigne():       void { this.lignes.push({ description: '', quantite: 1, prixUnitaire: 0 }); }
  removeLigne(i: number): void { this.lignes.splice(i, 1); this.calcTotal(); }

  calcTotal(): void {
    this.totalCalcule = this.lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.getRawValue();
    this.api.saveFacture({
      ...v,
      montantTotal: this.totalCalcule,
      lignes: this.lignes.map(l => ({ ...l, total: l.quantite * l.prixUnitaire }))
    }).subscribe({
      next: () => { this.load(); this.showForm = false; this.loading = false;
        this.api.factureStats().subscribe(s => this.stats = s);
        this.lignes = [{ description: '', quantite: 1, prixUnitaire: 0 }];
        this.totalCalcule = 0; this.form.reset(); },
      error: () => this.loading = false
    });
  }

  openPaiement(f: any): void {
    this.factureSelectee = f;
    this.montantPaiement = f.montantTotal - f.montantPaye;
    this.statutPaiement  = f.montantPaye >= f.montantTotal ? 'PAYE' : 'EN_ATTENTE';
  }

  enregistrerPaiement(): void {
    if (!this.factureSelectee) return;
    this.api.paiementFacture(this.factureSelectee.id, this.montantPaiement, this.statutPaiement).subscribe(() => {
      this.load(); this.api.factureStats().subscribe(s => this.stats = s);
      this.factureSelectee = null;
    });
  }

  remove(id: number): void {
    if (!confirm('Supprimer cette facture ?')) return;
    this.api.deleteFacture(id).subscribe(() => { this.load(); this.api.factureStats().subscribe(s => this.stats = s); });
  }

  setFiltre(v: string): void { this.filtreActif = v; }

  facturesFiltrees(): any[] {
    return this.filtreActif ? this.factures.filter(f => f.statut === this.filtreActif) : this.factures;
  }

  badgeClass(s: string): string { return 'fac-badge badge-' + (s || '').toLowerCase(); }
  statutLabel(s: string): string {
    const m: Record<string,string> = {
      EN_ATTENTE:'En attente', PAYE:'Payé', PARTIELLEMENT_PAYE:'Partiel',
      REMBOURSE:'Remboursé', ANNULE:'Annulé'
    };
    return m[s] ?? s;
  }
}
