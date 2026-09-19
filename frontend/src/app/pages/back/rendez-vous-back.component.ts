import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-rdv-back',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, SlicePipe],
  template: `
    <div class="rdv-page">

      <!-- ── TOAST NOTIFICATION ─────────────────────── -->
      <div class="rdv-toast" [class.show]="toast.show" [class]="'rdv-toast ' + toast.type + (toast.show ? ' show' : '')">
        <i [class]="toast.icon"></i>
        <div>
          <strong>{{ toast.title }}</strong>
          <span>{{ toast.msg }}</span>
        </div>
      </div>

      <!-- ── HEADER ─────────────────────────────────── -->
      <div class="rdv-header">
        <div>
          <h2 class="rdv-title">
            <i class="fa fa-calendar-check"></i>
            {{ isMedecin ? 'Mes rendez-vous' : 'Gestion des rendez-vous' }}
          </h2>
          <p class="rdv-sub">{{ items.length }} rendez-vous au total</p>
        </div>
        <button class="rdv-btn-primary" *ngIf="!isMedecin" (click)="showForm=!showForm">
          <i [class]="showForm ? 'fa fa-xmark' : 'fa fa-plus'"></i>
          {{ showForm ? 'Fermer' : 'Nouveau RDV' }}
        </button>
      </div>

      <!-- ── STATS CHIPS ────────────────────────────── -->
      <div class="rdv-chips">
        <div class="rdv-chip" *ngFor="let s of stats()">
          <span class="rdv-chip-dot" [style.background]="s.color"></span>
          <span class="rdv-chip-lbl">{{ s.label }}</span>
          <span class="rdv-chip-count">{{ s.count }}</span>
        </div>
      </div>

      <!-- ── FORMULAIRE NOUVEAU RDV (admin/secrétaire) ── -->
      <div class="rdv-form-card" *ngIf="showForm && !isMedecin">
        <div class="rdv-form-head">
          <i class="fa fa-calendar-plus"></i>
          {{ editingId ? 'Modifier le rendez-vous' : 'Planifier un rendez-vous' }}
          <button class="rdv-close-btn" (click)="reset()"><i class="fa fa-xmark"></i></button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="rdv-form-body">
          <div class="rdv-form-row">
            <div class="rdv-field">
              <label>Patient *</label>
              <select formControlName="patientId">
                <option [ngValue]="null">— Choisir —</option>
                <option *ngFor="let p of patients" [ngValue]="p.id">{{ p.prenom }} {{ p.nom }}</option>
              </select>
            </div>
            <div class="rdv-field">
              <label>Médecin *</label>
              <select formControlName="medecinId">
                <option [ngValue]="null">— Choisir —</option>
                <option *ngFor="let m of medecins" [ngValue]="m.id">Dr {{ m.prenom }} {{ m.nom }} — {{ m.specialite }}</option>
              </select>
            </div>
          </div>
          <div class="rdv-form-row">
            <div class="rdv-field">
              <label>Date et heure *</label>
              <input type="datetime-local" formControlName="dateHeure">
            </div>
            <div class="rdv-field">
              <label>Statut</label>
              <select formControlName="statut">
                <option value="PLANIFIE">Planifié</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="ANNULE">Annulé</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>
          <div class="rdv-form-row">
            <div class="rdv-field">
              <label>Motif</label>
              <input formControlName="motif" placeholder="Consultation générale">
            </div>
            <div class="rdv-field">
              <label>Notes internes</label>
              <input formControlName="notes" placeholder="Notes">
            </div>
          </div>
          <div class="rdv-form-actions">
            <button type="button" class="rdv-btn-ghost" (click)="reset()">Annuler</button>
            <button type="submit" class="rdv-btn-primary">
              <i class="fa fa-floppy-disk"></i> Enregistrer
            </button>
          </div>
        </form>
      </div>

      <!-- ── LISTE ──────────────────────────────────── -->
      <div class="rdv-list-card">

        <!-- Filtres -->
        <div class="rdv-filters">
          <button *ngFor="let f of filtres" [class.active]="filtreActif===f.val" (click)="filtreActif=f.val">
            {{ f.label }}
            <span class="rdv-f-count">{{ countStatut(f.val) }}</span>
          </button>
        </div>

        <!-- Table -->
        <div class="rdv-table-wrap">
          <table class="rdv-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Patient</th>
                <th *ngIf="!isMedecin">Médecin</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions rapides</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filtered()" class="rdv-row">
                <td>
                  <div class="rdv-date">{{ r.dateHeure | slice:8:10 }}/{{ r.dateHeure | slice:5:7 }}/{{ r.dateHeure | slice:0:4 }}</div>
                  <div class="rdv-time">{{ r.dateHeure | slice:11:16 }}</div>
                </td>
                <td>
                  <div class="rdv-patient">
                    <div class="rdv-av">{{ r.patientNom?.charAt(0) }}</div>
                    <span>{{ r.patientNom }}</span>
                  </div>
                </td>
                <td *ngIf="!isMedecin" class="rdv-med-cell">{{ r.medecinNom }}</td>
                <td class="rdv-motif">{{ r.motif || '—' }}</td>
                <td>
                  <span class="rdv-badge"
                    [class.badge-planifie]="r.statut==='PLANIFIE'"
                    [class.badge-confirme]="r.statut==='CONFIRME'"
                    [class.badge-annule]="r.statut==='ANNULE'"
                    [class.badge-termine]="r.statut==='TERMINE'">
                    {{ statutLabel(r.statut) }}
                  </span>
                </td>
                <td>
                  <div class="rdv-actions">
                    <!-- Confirmer -->
                    <button class="rdv-act-btn confirm"
                      *ngIf="r.statut === 'PLANIFIE'"
                      (click)="changerStatut(r, 'CONFIRME')"
                      title="Confirmer ce RDV">
                      <i class="fa fa-check"></i> Confirmer
                    </button>
                    <!-- Annuler -->
                    <button class="rdv-act-btn annuler"
                      *ngIf="r.statut === 'PLANIFIE' || r.statut === 'CONFIRME'"
                      (click)="changerStatut(r, 'ANNULE')"
                      title="Annuler ce RDV">
                      <i class="fa fa-ban"></i> Annuler
                    </button>
                    <!-- Terminer -->
                    <button class="rdv-act-btn terminer"
                      *ngIf="r.statut === 'CONFIRME'"
                      (click)="changerStatut(r, 'TERMINE')"
                      title="Marquer terminé">
                      <i class="fa fa-flag-checkered"></i>
                    </button>
                    <!-- Éditer (admin/secrétaire) -->
                    <button class="rdv-act-btn edit" *ngIf="!isMedecin" (click)="edit(r)" title="Modifier">
                      <i class="fa fa-pen"></i>
                    </button>
                    <!-- Supprimer -->
                    <button class="rdv-act-btn delete" *ngIf="!isMedecin" (click)="remove(r.id)" title="Supprimer">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td [attr.colspan]="isMedecin ? 5 : 6" class="rdv-empty">
                  <i class="fa fa-calendar-xmark"></i>
                  <p>Aucun rendez-vous dans cette catégorie</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .rdv-page { display:flex; flex-direction:column; gap:20px; position:relative; }

    /* ── TOAST ──────────────────────────────── */
    .rdv-toast {
      position:fixed; top:80px; right:24px; z-index:9999;
      display:flex; align-items:flex-start; gap:12px; padding:14px 18px;
      border-radius:14px; min-width:300px; max-width:380px;
      box-shadow:0 8px 32px rgba(0,0,0,.15); border:1.5px solid transparent;
      opacity:0; transform:translateX(40px); pointer-events:none;
      transition:all .35s cubic-bezier(.4,0,.2,1);
    }
    .rdv-toast.show { opacity:1; transform:translateX(0); pointer-events:all; }
    .rdv-toast i { font-size:20px; flex-shrink:0; margin-top:2px; }
    .rdv-toast strong { display:block; font-size:14px; font-weight:800; margin-bottom:2px; }
    .rdv-toast span   { font-size:12.5px; opacity:.8; }
    .rdv-toast.success { background:#f0fdf4; border-color:#86efac; color:#14532d; }
    .rdv-toast.success i { color:#22c55e; }
    .rdv-toast.error   { background:#fff5f5; border-color:#fca5a5; color:#7f1d1d; }
    .rdv-toast.error i { color:#ef4444; }
    .rdv-toast.info    { background:#eff6ff; border-color:#93c5fd; color:#1e3a5f; }
    .rdv-toast.info i  { color:#3b82f6; }

    /* ── HEADER ─────────────────────────────── */
    .rdv-header { display:flex; align-items:center; justify-content:space-between; }
    .rdv-title  { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 4px; }
    .rdv-title i{ color:var(--primary,#0f6cbd); margin-right:8px; }
    .rdv-sub    { font-size:13px; color:var(--text-muted,#64748b); margin:0; }

    /* ── CHIPS ──────────────────────────────── */
    .rdv-chips { display:flex; gap:10px; flex-wrap:wrap; }
    .rdv-chip {
      display:flex; align-items:center; gap:7px; padding:6px 14px;
      border-radius:999px; background:var(--surface,#fff);
      border:1.5px solid var(--border,#e2e8f0); font-size:12.5px;
    }
    .rdv-chip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .rdv-chip-lbl { color:var(--text-muted,#64748b); }
    .rdv-chip-count {
      font-weight:800; color:var(--text,#0f172a); background:var(--bg,#f0f4f8);
      padding:1px 7px; border-radius:999px; font-size:11px;
    }

    /* ── BOUTONS ────────────────────────────── */
    .rdv-btn-primary {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:13.5px; font-weight:700; transition:all .2s;
      box-shadow:0 4px 14px rgba(15,108,189,.3);
    }
    .rdv-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,108,189,.4); }
    .rdv-btn-ghost {
      padding:9px 18px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13px; font-weight:600; cursor:pointer;
    }

    /* ── FORMULAIRE ─────────────────────────── */
    .rdv-form-card {
      background:var(--surface,#fff); border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08);
      animation:slideDown .25s ease;
    }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    .rdv-form-head {
      display:flex; align-items:center; gap:10px; padding:14px 20px;
      background:linear-gradient(135deg,#f0f9ff,#e6faf5);
      font-size:15px; font-weight:800; color:#0f172a; border-bottom:1.5px solid #e2e8f0;
    }
    .rdv-form-head i { color:#0f6cbd; }
    .rdv-close-btn { margin-left:auto; background:none; border:none; cursor:pointer; color:#94a3b8; font-size:16px; }
    .rdv-close-btn:hover { color:#ef4444; }
    .rdv-form-body { padding:20px; display:flex; flex-direction:column; gap:14px; }
    .rdv-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .rdv-field { display:flex; flex-direction:column; gap:5px; }
    .rdv-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .rdv-field input, .rdv-field select {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px; outline:none;
      transition:border-color .2s;
    }
    .rdv-field input:focus, .rdv-field select:focus { border-color:#0f6cbd; background:#fff; }
    .rdv-form-actions { display:flex; gap:10px; justify-content:flex-end; border-top:1.5px solid #f1f5f9; padding-top:12px; }

    /* ── LISTE ──────────────────────────────── */
    .rdv-list-card {
      background:var(--surface,#fff); border-radius:18px; border:1.5px solid var(--border,#e2e8f0);
      overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .rdv-filters {
      display:flex; gap:4px; padding:12px 16px; border-bottom:1.5px solid var(--border,#f1f5f9);
      flex-wrap:wrap;
    }
    .rdv-filters button {
      display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px;
      border:1.5px solid var(--border,#e2e8f0); background:transparent;
      color:var(--text-muted,#64748b); font-size:12.5px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .rdv-filters button.active { background:#e8f4ff; color:#0f6cbd; border-color:#bfdbfe; }
    .rdv-filters button:hover:not(.active) { background:var(--bg,#f0f4f8); }
    .rdv-f-count {
      min-width:18px; height:18px; border-radius:999px; padding:0 5px;
      background:var(--bg,#f0f4f8); color:var(--text-muted,#64748b);
      font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center;
    }

    .rdv-table-wrap { overflow-x:auto; }
    .rdv-table { width:100%; border-collapse:collapse; font-size:13.5px; }
    .rdv-table thead tr { border-bottom:2px solid var(--border,#e2e8f0); }
    .rdv-table th {
      padding:11px 14px; text-align:left; font-size:11px; font-weight:800;
      text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted,#94a3b8);
    }
    .rdv-row { border-bottom:1px solid var(--border,#f1f5f9); transition:background .15s; }
    .rdv-row:last-child { border-bottom:none; }
    .rdv-row:hover { background:var(--bg,#f8fafc); }
    .rdv-table td { padding:12px 14px; vertical-align:middle; }
    .rdv-date  { font-size:13px; font-weight:700; color:var(--text,#0f172a); }
    .rdv-time  { font-size:12px; color:#0f6cbd; font-weight:600; margin-top:2px; }
    .rdv-patient { display:flex; align-items:center; gap:8px; font-weight:600; color:var(--text,#0f172a); }
    .rdv-av {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .rdv-med-cell { font-size:13px; color:var(--text-muted,#64748b); }
    .rdv-motif    { font-size:12.5px; color:var(--text-muted,#64748b); }

    .rdv-badge { padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .badge-planifie { background:#dbeafe; color:#1d4ed8; }
    .badge-confirme { background:#dcfce7; color:#15803d; }
    .badge-annule   { background:#fee2e2; color:#b91c1c; }
    .badge-termine  { background:#f1f5f9; color:#64748b; }

    /* ── ACTIONS RAPIDES ────────────────────── */
    .rdv-actions { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
    .rdv-act-btn {
      display:inline-flex; align-items:center; gap:5px;
      padding:5px 11px; border-radius:7px; border:none; cursor:pointer;
      font-size:12px; font-weight:700; transition:all .18s; white-space:nowrap;
    }
    .rdv-act-btn.confirm { background:#dcfce7; color:#15803d; }
    .rdv-act-btn.confirm:hover { background:#15803d; color:#fff; }
    .rdv-act-btn.annuler { background:#fee2e2; color:#b91c1c; }
    .rdv-act-btn.annuler:hover { background:#b91c1c; color:#fff; }
    .rdv-act-btn.terminer { background:#f1f5f9; color:#64748b; }
    .rdv-act-btn.terminer:hover { background:#64748b; color:#fff; }
    .rdv-act-btn.edit   { background:#dbeafe; color:#1d4ed8; width:28px; height:28px; padding:0; justify-content:center; }
    .rdv-act-btn.edit:hover { background:#1d4ed8; color:#fff; }
    .rdv-act-btn.delete { background:#fee2e2; color:#b91c1c; width:28px; height:28px; padding:0; justify-content:center; }
    .rdv-act-btn.delete:hover { background:#b91c1c; color:#fff; }

    .rdv-empty { text-align:center; padding:48px; color:var(--text-muted,#94a3b8); }
    .rdv-empty i { font-size:32px; display:block; margin-bottom:10px; }
    .rdv-empty p { margin:0; }
  `]
})
export class RendezVousBackComponent implements OnInit {
  items: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  editingId?: number;
  showForm = false;
  isMedecin = false;
  medecinId?: number;
  filtreActif = '';

  toast = { show: false, type: 'success', icon: 'fa fa-check-circle', title: '', msg: '' };

  filtres = [
    { label: 'Tous', val: '' },
    { label: 'Planifiés', val: 'PLANIFIE' },
    { label: 'Confirmés', val: 'CONFIRME' },
    { label: 'Annulés', val: 'ANNULE' },
    { label: 'Terminés', val: 'TERMINE' },
  ];

  form = this.fb.group({
    patientId: [null as number | null],
    medecinId: [null as number | null],
    dateHeure: [''],
    motif: [''],
    statut: ['PLANIFIE'],
    notes: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isMedecin = this.auth.role() === 'MEDECIN';
    if (this.isMedecin) {
      const uid = this.auth.current()?.id;
      if (!uid) return;
      this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
        if (m) { this.medecinId = m.id; this.load(); }
      });
    } else {
      this.api.patients().subscribe(p => this.patients = p);
      this.api.medecins().subscribe(m => this.medecins = m);
      this.load();
    }
  }

  load(): void {
    if (this.isMedecin && this.medecinId) {
      this.api.rdvsMedecin(this.medecinId).subscribe(d => this.items = d);
    } else {
      this.api.rdvs().subscribe(d => this.items = d);
    }
  }

  changerStatut(r: any, statut: string): void {
    const msg = statut === 'CONFIRME'
      ? `Confirmer le RDV de ${r.patientNom} ?`
      : statut === 'ANNULE'
      ? `Annuler le RDV de ${r.patientNom} ?`
      : `Marquer le RDV de ${r.patientNom} comme terminé ?`;

    if (!confirm(msg)) return;

    const payload = { ...r, statut };
    this.api.saveRdv(payload, r.id).subscribe({
      next: (updated: any) => {
        // Mettre à jour en local immédiatement
        const idx = this.items.findIndex(x => x.id === r.id);
        if (idx >= 0) this.items[idx] = { ...this.items[idx], statut };

        if (statut === 'CONFIRME') {
          this.showToast('success', 'fa fa-circle-check', '✅ RDV Confirmé',
            `Le rendez-vous de ${r.patientNom} a été confirmé. Notifications envoyées.`);
        } else if (statut === 'ANNULE') {
          this.showToast('error', 'fa fa-circle-xmark', '❌ RDV Annulé',
            `Le rendez-vous de ${r.patientNom} a été annulé. Notifications envoyées.`);
        } else {
          this.showToast('info', 'fa fa-flag-checkered', '🏁 RDV Terminé',
            `Le rendez-vous de ${r.patientNom} est marqué comme terminé.`);
        }
      },
      error: () => this.showToast('error', 'fa fa-triangle-exclamation', 'Erreur', 'Impossible de mettre à jour le statut.')
    });
  }

  save(): void {
    this.api.saveRdv(this.form.getRawValue(), this.editingId).subscribe({
      next: () => {
        this.reset(); this.load();
        this.showToast('success', 'fa fa-circle-check', 'Enregistré', 'Le rendez-vous a été enregistré.');
      },
      error: () => this.showToast('error', 'fa fa-triangle-exclamation', 'Erreur', 'Impossible d\'enregistrer.')
    });
  }

  edit(r: any): void {
    this.editingId = r.id; this.showForm = true;
    this.form.patchValue({ ...r, dateHeure: (r.dateHeure || '').slice(0, 16) });
  }

  reset(): void {
    this.editingId = undefined; this.showForm = false;
    this.form.reset({ statut: 'PLANIFIE' });
  }

  remove(id: number): void {
    if (confirm('Supprimer ce rendez-vous définitivement ?')) {
      this.api.deleteRdv(id).subscribe(() => { this.load(); });
    }
  }

  showToast(type: string, icon: string, title: string, msg: string): void {
    this.toast = { show: true, type, icon, title, msg };
    setTimeout(() => this.toast = { ...this.toast, show: false }, 4500);
  }

  filtered(): any[] {
    return this.filtreActif ? this.items.filter(r => r.statut === this.filtreActif) : this.items;
  }

  countStatut(s: string): number {
    return s ? this.items.filter(r => r.statut === s).length : this.items.length;
  }

  stats(): { label: string; count: number; color: string }[] {
    return [
      { label: 'Planifiés', count: this.countStatut('PLANIFIE'), color: '#3b82f6' },
      { label: 'Confirmés', count: this.countStatut('CONFIRME'), color: '#22c55e' },
      { label: 'Annulés',  count: this.countStatut('ANNULE'),   color: '#ef4444' },
      { label: 'Terminés', count: this.countStatut('TERMINE'),  color: '#94a3b8' },
    ];
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = { PLANIFIE: 'Planifié', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };
    return m[s] ?? s;
  }
}
