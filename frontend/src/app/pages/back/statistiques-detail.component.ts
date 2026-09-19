import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-statistiques-detail',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, DatePipe],
  template: `
    <div class="stat-page">

      <!-- ── HEADER ─────────────────────────────── -->
      <div class="stat-header">
        <div>
          <h2 class="stat-title"><i class="fa fa-chart-line"></i> Statistiques & Dashboard Admin</h2>
          <p class="stat-sub">Vue d'ensemble de l'activité de la clinique</p>
        </div>
        <button class="btn-refresh" (click)="load()">
          <i class="fa fa-rotate-right"></i> Actualiser
        </button>
      </div>

      <!-- ── LOADING ────────────────────────────── -->
      <div class="stat-loading" *ngIf="loading">
        <div class="stat-spin"></div> Chargement des statistiques…
      </div>

      <ng-container *ngIf="!loading && stats">

        <!-- ── KPI PRINCIPAUX ──────────────────── -->
        <div class="stat-kpis">
          <div class="stat-kpi" *ngFor="let k of mainKpis">
            <div class="stat-kpi-icon" [style.background]="k.bg" [style.color]="k.color">
              <i [class]="'fa ' + k.icon"></i>
            </div>
            <div class="stat-kpi-body">
              <div class="stat-kpi-val">{{ k.val }}</div>
              <div class="stat-kpi-lbl">{{ k.label }}</div>
            </div>
            <div class="stat-kpi-trend" *ngIf="k.trend" [style.color]="k.trend > 0 ? '#22c55e' : '#ef4444'">
              <i [class]="k.trend > 0 ? 'fa fa-arrow-trend-up' : 'fa fa-arrow-trend-down'"></i>
            </div>
          </div>
        </div>

        <!-- ── ROW 1 : RDV + Facturation ─────────────────── -->
        <div class="stat-row">

          <!-- Rendez-vous par statut -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-calendar-check"></i> Rendez-vous par statut</span>
              <span class="stat-total">{{ stats.rendezVous }} total</span>
            </div>
            <div class="stat-bars">
              <div class="stat-bar-row" *ngFor="let r of rdvStats">
                <span class="stat-bar-label">{{ r.label }}</span>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" [style.background]="r.color"
                       [style.width]="pct(r.val, stats.rendezVous) + '%'"></div>
                </div>
                <span class="stat-bar-pct">{{ pct(r.val, stats.rendezVous) }}%</span>
                <span class="stat-bar-val" [style.color]="r.color">{{ r.val }}</span>
              </div>
            </div>
            <div class="stat-taux-row">
              <div class="stat-taux">
                <div class="stat-taux-v" style="color:#22c55e">{{ stats.tauxConfirmation }}%</div>
                <div class="stat-taux-l">Taux conf.</div>
              </div>
              <div class="stat-taux">
                <div class="stat-taux-v" style="color:#ef4444">{{ stats.tauxAnnulation }}%</div>
                <div class="stat-taux-l">Taux annul.</div>
              </div>
              <div class="stat-taux">
                <div class="stat-taux-v" style="color:#7e22ce">{{ stats.consultations }}</div>
                <div class="stat-taux-l">Consultations</div>
              </div>
            </div>
          </div>

          <!-- Facturation -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-coins"></i> Facturation & Revenus</span>
            </div>
            <div class="stat-revenue-grid">
              <div class="stat-revenue-box">
                <div class="stat-revenue-icon" style="background:#dcfce7;color:#15803d">
                  <i class="fa fa-coins"></i>
                </div>
                <div class="stat-revenue-val">{{ stats.revenusTotal | number:'1.0-0' }} €</div>
                <div class="stat-revenue-lbl">Revenus totaux</div>
              </div>
              <div class="stat-revenue-box">
                <div class="stat-revenue-icon" style="background:#dbeafe;color:#1d4ed8">
                  <i class="fa fa-calendar-day"></i>
                </div>
                <div class="stat-revenue-val">{{ stats.revenusMoisActuel | number:'1.0-0' }} €</div>
                <div class="stat-revenue-lbl">Ce mois</div>
              </div>
              <div class="stat-revenue-box">
                <div class="stat-revenue-icon" style="background:#fef9c3;color:#854d0e">
                  <i class="fa fa-clock"></i>
                </div>
                <div class="stat-revenue-val">{{ stats.facturesEnAttente }}</div>
                <div class="stat-revenue-lbl">En attente</div>
              </div>
              <div class="stat-revenue-box">
                <div class="stat-revenue-icon" style="background:#f3e8ff;color:#7e22ce">
                  <i class="fa fa-file-invoice"></i>
                </div>
                <div class="stat-revenue-val">{{ stats.facturesPayees }}</div>
                <div class="stat-revenue-lbl">Payées</div>
              </div>
            </div>
            <!-- Barre progression paiement -->
            <div class="stat-pay-track-label">
              Taux de paiement :
              {{ stats.facturesTotal > 0 ? ((stats.facturesPayees / stats.facturesTotal) * 100 | number:'1.0-0') : 0 }}%
            </div>
            <div class="stat-pay-track">
              <div class="stat-pay-fill"
                   [style.width]="(stats.facturesTotal > 0 ? (stats.facturesPayees / stats.facturesTotal) * 100 : 0) + '%'">
              </div>
            </div>
          </div>

        </div>

        <!-- ── ROW 2 : Examens + Médecins ───────── -->
        <div class="stat-row">

          <!-- Examens laboratoire -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-flask"></i> Examens & Laboratoire</span>
              <span class="stat-total">{{ stats.examensTotal }} total</span>
            </div>
            <div class="stat-exam-grid">
              <div class="stat-exam-box" *ngFor="let e of examStats">
                <div class="stat-exam-circle" [style.border-color]="e.color">{{ e.val }}</div>
                <div class="stat-exam-lbl" [style.color]="e.color">{{ e.label }}</div>
              </div>
            </div>
          </div>

          <!-- Top médecins -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-trophy"></i> Top médecins (par RDV)</span>
            </div>
            <div class="stat-doctors">
              <div class="stat-doc-row" *ngFor="let m of stats.topMedecins; let i = index">
                <div class="stat-doc-rank" [class]="'rank-' + (i + 1)">{{ i + 1 }}</div>
                <div class="stat-doc-av">{{ m.nomMedecin?.charAt(0) }}</div>
                <div class="stat-doc-info">
                  <span class="stat-doc-name">{{ m.nomMedecin }}</span>
                  <span class="stat-doc-spec" *ngIf="m.specialite">{{ m.specialite }}</span>
                </div>
                <div class="stat-doc-bar-wrap">
                  <div class="stat-doc-bar">
                    <div class="stat-doc-fill"
                         [style.width]="docPct(m.nbRendezVous) + '%'"
                         [style.background]="rankColor(i)"></div>
                  </div>
                  <span class="stat-doc-count">{{ m.nbRendezVous }} RDV</span>
                </div>
              </div>
              <div class="stat-empty" *ngIf="!stats.topMedecins?.length">
                Aucune donnée disponible
              </div>
            </div>
          </div>

        </div>

        <!-- ── ROW 3 : Occupation + Activité ──── -->
        <div class="stat-row stat-row-3">

          <!-- Taux occupation médecins -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-user-doctor"></i> Médecins</span>
            </div>
            <div class="stat-occ-wrap">
              <div class="stat-occ-ring">
                <svg viewBox="0 0 100 100" class="stat-ring-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="10"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="10"
                          [attr.stroke-dasharray]="(dispoPct * 2.51) + ' 251'"
                          stroke-linecap="round" transform="rotate(-90 50 50)"/>
                </svg>
                <div class="stat-ring-center">
                  <span class="stat-ring-val">{{ dispoPct }}%</span>
                  <span class="stat-ring-lbl">Dispo.</span>
                </div>
              </div>
              <div class="stat-occ-detail">
                <div class="stat-occ-row">
                  <span class="dot" style="background:#22c55e"></span>
                  <span>Disponibles : {{ stats.medecinsDisponibles }}</span>
                </div>
                <div class="stat-occ-row">
                  <span class="dot" style="background:#ef4444"></span>
                  <span>Indisponibles : {{ stats.medecins - stats.medecinsDisponibles }}</span>
                </div>
                <div class="stat-occ-row">
                  <span class="dot" style="background:#0f6cbd"></span>
                  <span>Total : {{ stats.medecins }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activité globale -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-chart-pie"></i> Activité globale</span>
            </div>
            <div class="stat-activity">
              <div class="stat-act-row" *ngFor="let a of activityStats">
                <div class="stat-act-icon" [style.background]="a.bg" [style.color]="a.color">
                  <i [class]="'fa ' + a.icon"></i>
                </div>
                <div class="stat-act-info">
                  <span class="stat-act-label">{{ a.label }}</span>
                  <div class="stat-act-bar">
                    <div class="stat-act-fill" [style.width]="a.pct + '%'" [style.background]="a.color"></div>
                  </div>
                </div>
                <span class="stat-act-val" [style.color]="a.color">{{ a.val }}</span>
              </div>
            </div>
          </div>

          <!-- Synthèse système -->
          <div class="stat-card">
            <div class="stat-card-head">
              <span><i class="fa fa-hospital"></i> Synthèse système</span>
            </div>
            <div class="stat-synth">
              <div class="stat-synth-row" *ngFor="let s of synthese">
                <i [class]="'fa ' + s.icon" [style.color]="s.color"></i>
                <div class="stat-synth-info">
                  <span class="stat-synth-label">{{ s.label }}</span>
                  <span class="stat-synth-val">{{ s.val }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .stat-page { display:flex; flex-direction:column; gap:22px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    .stat-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
    .stat-title { font-size:22px; font-weight:900; color:var(--text,#0f172a); margin:0 0 4px;
      display:flex; align-items:center; gap:10px; }
    .stat-title i { color:#0f6cbd; }
    .stat-sub { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .btn-refresh { display:flex; align-items:center; gap:7px; padding:9px 18px;
      border-radius:10px; border:1.5px solid var(--border,#e2e8f0); background:var(--surface,#fff);
      color:var(--text-muted,#64748b); font-size:13.5px; font-weight:600; cursor:pointer; transition:all .18s; }
    .btn-refresh:hover { background:#dbeafe; color:#0f6cbd; border-color:#bfdbfe; }

    .stat-loading { display:flex; align-items:center; gap:12px; padding:40px; color:var(--text-muted,#64748b); font-size:14px; }
    .stat-spin { width:20px; height:20px; border-radius:50%; border:3px solid #e2e8f0; border-top-color:#0f6cbd; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }

    /* KPI row */
    .stat-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:14px; }
    .stat-kpi {
      background:var(--surface,#fff); border-radius:14px; padding:18px 16px;
      border:1.5px solid var(--border,#e2e8f0); display:flex; align-items:center; gap:14px;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .2s;
    }
    .stat-kpi:hover { transform:translateY(-3px); }
    .stat-kpi-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center;
      justify-content:center; font-size:20px; flex-shrink:0; }
    .stat-kpi-val  { font-size:24px; font-weight:900; color:var(--text,#0f172a); }
    .stat-kpi-lbl  { font-size:12px; color:var(--text-muted,#64748b); font-weight:600; margin-top:2px; }
    .stat-kpi-trend { margin-left:auto; font-size:18px; }

    /* Rows */
    .stat-row { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    .stat-row-3 { grid-template-columns:1fr 1fr 1fr; }
    @media(max-width:1100px) { .stat-row-3 { grid-template-columns:1fr 1fr; } }
    @media(max-width:750px)  { .stat-row, .stat-row-3 { grid-template-columns:1fr; } }

    /* Card */
    .stat-card {
      background:var(--surface,#fff); border-radius:18px; padding:24px;
      border:1.5px solid var(--border,#e2e8f0); box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .stat-card-head {
      display:flex; align-items:center; justify-content:space-between;
      font-size:14.5px; font-weight:800; color:var(--text,#0f172a); margin-bottom:20px;
    }
    .stat-card-head i { color:#0f6cbd; margin-right:8px; }
    .stat-total { font-size:12px; color:var(--text-muted,#94a3b8);
      background:var(--bg,#f0f4f8); padding:3px 10px; border-radius:999px; }

    /* Bars */
    .stat-bars { display:flex; flex-direction:column; gap:12px; margin-bottom:18px; }
    .stat-bar-row { display:flex; align-items:center; gap:10px; }
    .stat-bar-label { font-size:13px; font-weight:600; color:var(--text,#0f172a); width:80px; flex-shrink:0; }
    .stat-bar-track { flex:1; height:8px; background:var(--border,#e2e8f0); border-radius:99px; overflow:hidden; }
    .stat-bar-fill  { height:100%; border-radius:99px; transition:width .8s ease; min-width:4px; }
    .stat-bar-pct   { font-size:11px; color:var(--text-muted,#94a3b8); width:32px; text-align:right; }
    .stat-bar-val   { font-size:14px; font-weight:800; width:24px; text-align:right; }

    .stat-taux-row { display:flex; border-top:1.5px solid var(--border,#f1f5f9); padding-top:14px; }
    .stat-taux { flex:1; text-align:center; }
    .stat-taux:not(:last-child) { border-right:1.5px solid var(--border,#f1f5f9); }
    .stat-taux-v { font-size:20px; font-weight:900; }
    .stat-taux-l { font-size:11px; color:var(--text-muted,#94a3b8); margin-top:2px; }

    /* Revenue */
    .stat-revenue-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
    .stat-revenue-box { display:flex; align-items:center; gap:10px;
      padding:12px 14px; border-radius:12px; background:var(--bg,#f8fafc);
      border:1px solid var(--border,#f1f5f9); }
    .stat-revenue-icon { width:36px; height:36px; border-radius:10px; display:flex;
      align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
    .stat-revenue-val { font-size:18px; font-weight:900; color:var(--text,#0f172a); }
    .stat-revenue-lbl { font-size:11.5px; color:var(--text-muted,#64748b); margin-top:2px; }
    .stat-pay-track-label { font-size:12px; font-weight:600; color:var(--text-muted,#475569); margin-bottom:6px; }
    .stat-pay-track { height:10px; background:var(--border,#e2e8f0); border-radius:99px; overflow:hidden; }
    .stat-pay-fill  { height:100%; background:linear-gradient(90deg,#22c55e,#00b389); border-radius:99px; transition:width .8s ease; }

    /* Examens */
    .stat-exam-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; text-align:center; }
    .stat-exam-circle {
      width:56px; height:56px; border-radius:50%; border:3px solid; margin:0 auto 8px;
      display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;
      color:var(--text,#0f172a);
    }
    .stat-exam-lbl { font-size:12px; font-weight:700; }

    /* Top médecins */
    .stat-doctors { display:flex; flex-direction:column; gap:10px; }
    .stat-doc-row { display:flex; align-items:center; gap:10px; }
    .stat-doc-rank {
      width:24px; height:24px; border-radius:7px; font-size:12px; font-weight:900;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .rank-1 { background:#fef9c3; color:#854d0e; }
    .rank-2 { background:#f1f5f9; color:#475569; }
    .rank-3 { background:#fff7ed; color:#c2410c; }
    .rank-4, .rank-5 { background:#f8fafc; color:#94a3b8; }
    .stat-doc-av {
      width:32px; height:32px; border-radius:9px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .stat-doc-info { min-width:80px; }
    .stat-doc-name { display:block; font-size:13px; font-weight:700; color:var(--text,#0f172a); }
    .stat-doc-spec { display:block; font-size:11px; color:var(--text-muted,#94a3b8); }
    .stat-doc-bar-wrap { flex:1; display:flex; align-items:center; gap:8px; }
    .stat-doc-bar { flex:1; height:7px; background:var(--border,#e2e8f0); border-radius:99px; overflow:hidden; }
    .stat-doc-fill { height:100%; border-radius:99px; transition:width .6s ease; min-width:4px; }
    .stat-doc-count { font-size:12px; font-weight:700; color:var(--text-muted,#64748b); white-space:nowrap; }

    /* Occupation ring */
    .stat-occ-wrap { display:flex; align-items:center; gap:24px; }
    .stat-occ-ring { position:relative; width:120px; height:120px; flex-shrink:0; }
    .stat-ring-svg { width:100%; height:100%; }
    .stat-ring-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
    .stat-ring-val { display:block; font-size:22px; font-weight:900; color:var(--text,#0f172a); }
    .stat-ring-lbl { display:block; font-size:11px; color:var(--text-muted,#94a3b8); }
    .stat-occ-detail { display:flex; flex-direction:column; gap:10px; }
    .stat-occ-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text,#0f172a); }
    .dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

    /* Activity */
    .stat-activity { display:flex; flex-direction:column; gap:12px; }
    .stat-act-row { display:flex; align-items:center; gap:12px; }
    .stat-act-icon { width:36px; height:36px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:14px; }
    .stat-act-info { flex:1; }
    .stat-act-label { display:block; font-size:12.5px; font-weight:600; color:var(--text,#0f172a); margin-bottom:4px; }
    .stat-act-bar { height:6px; background:var(--border,#e2e8f0); border-radius:99px; overflow:hidden; }
    .stat-act-fill { height:100%; border-radius:99px; transition:width .6s ease; min-width:3px; }
    .stat-act-val { font-size:15px; font-weight:800; }

    /* Synthese */
    .stat-synth { display:flex; flex-direction:column; gap:12px; }
    .stat-synth-row { display:flex; align-items:center; gap:12px;
      padding:10px 12px; border-radius:10px; background:var(--bg,#f8fafc);
      border:1px solid var(--border,#f1f5f9); }
    .stat-synth-row i { font-size:16px; flex-shrink:0; }
    .stat-synth-info { flex:1; display:flex; justify-content:space-between; align-items:center; }
    .stat-synth-label { font-size:13px; color:var(--text-muted,#64748b); }
    .stat-synth-val   { font-size:14px; font-weight:800; color:var(--text,#0f172a); }

    .stat-empty { color:var(--text-muted,#94a3b8); font-size:13px; text-align:center; padding:20px; }
  `]
})
export class StatistiquesDetailComponent implements OnInit {
  stats: any = null;
  loading = true;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.statsDetail().subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get rdvStats() {
    if (!this.stats) return [];
    return [
      { label: 'Planifiés', val: this.stats.rendezVousPlanifies, color: '#3b82f6' },
      { label: 'Confirmés', val: this.stats.rendezVousConfirmes, color: '#22c55e' },
      { label: 'Terminés',  val: this.stats.rendezVousTermines,  color: '#f59e0b' },
      { label: 'Annulés',   val: this.stats.rendezVousAnnules,   color: '#ef4444' }
    ];
  }

  get examStats() {
    if (!this.stats) return [];
    return [
      { label: 'Total',    val: this.stats.examensTotal,              color: '#7e22ce' },
      { label: 'Demandés', val: this.stats.examensDemandes,           color: '#3b82f6' },
      { label: 'Résultats',val: this.stats.examensResultatsDisponibles,color: '#22c55e' },
      { label: 'Ordoces',  val: this.stats.ordonnances,               color: '#f59e0b' }
    ];
  }

  get mainKpis() {
    if (!this.stats) return [];
    return [
      { label: 'Patients',      val: this.stats.patients,      icon: 'fa-users',          bg: '#dbeafe', color: '#1d4ed8' },
      { label: 'Médecins',      val: this.stats.medecins,      icon: 'fa-user-doctor',    bg: '#dcfce7', color: '#15803d' },
      { label: 'Rendez-vous',   val: this.stats.rendezVous,    icon: 'fa-calendar-check', bg: '#fff7ed', color: '#c2410c', trend: 1 },
      { label: 'Consultations', val: this.stats.consultations, icon: 'fa-stethoscope',    bg: '#f3e8ff', color: '#7e22ce' },
      { label: 'Factures',      val: this.stats.facturesTotal, icon: 'fa-file-invoice',   bg: '#fef9c3', color: '#854d0e' },
      { label: 'Examens',       val: this.stats.examensTotal,  icon: 'fa-flask',          bg: '#e0f2fe', color: '#0369a1' },
      { label: 'Utilisateurs',  val: this.stats.utilisateurs,  icon: 'fa-shield-halved',  bg: '#f0fdf4', color: '#166534' },
      { label: 'Revenus (€)',   val: (this.stats.revenusTotal ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }),
        icon: 'fa-coins', bg: '#dcfce7', color: '#15803d', trend: 1 }
    ];
  }

  get activityStats() {
    if (!this.stats) return [];
    const max = Math.max(this.stats.patients, this.stats.rendezVous, this.stats.consultations, 1);
    return [
      { label: 'Patients',      val: this.stats.patients,      icon: 'fa-users',      bg: '#dbeafe', color: '#1d4ed8', pct: pct(this.stats.patients, max) },
      { label: 'Rendez-vous',   val: this.stats.rendezVous,    icon: 'fa-calendar',   bg: '#dcfce7', color: '#22c55e', pct: pct(this.stats.rendezVous, max) },
      { label: 'Consultations', val: this.stats.consultations, icon: 'fa-stethoscope',bg: '#f3e8ff', color: '#7e22ce', pct: pct(this.stats.consultations, max) },
      { label: 'Ordonnances',   val: this.stats.ordonnances,   icon: 'fa-prescription',bg:'#fef9c3', color: '#854d0e', pct: pct(this.stats.ordonnances, max) }
    ];
  }

  get synthese() {
    if (!this.stats) return [];
    return [
      { label: 'Médecins disponibles', val: this.stats.medecinsDisponibles + ' / ' + this.stats.medecins, icon: 'fa-user-doctor', color: '#22c55e' },
      { label: 'Taux confirmation RDV', val: this.stats.tauxConfirmation + '%', icon: 'fa-chart-line', color: '#0f6cbd' },
      { label: 'Factures payées',       val: this.stats.facturesPayees + ' / ' + this.stats.facturesTotal, icon: 'fa-circle-check', color: '#15803d' },
      { label: 'Résultats examens dispo.', val: this.stats.examensResultatsDisponibles, icon: 'fa-flask', color: '#7e22ce' },
      { label: 'Comptes utilisateurs',  val: this.stats.utilisateurs, icon: 'fa-shield-halved', color: '#475569' }
    ];
  }

  get dispoPct(): number {
    if (!this.stats || !this.stats.medecins) return 0;
    return Math.round(this.stats.medecinsDisponibles / this.stats.medecins * 100);
  }

  pct(v: number, total: number): number {
    return total > 0 ? Math.round(v / total * 100) : 0;
  }

  docPct(v: number): number {
    const max = Math.max(...(this.stats?.topMedecins ?? []).map((m: any) => m.nbRendezVous), 1);
    return Math.round(v / max * 100);
  }

  rankColor(i: number): string {
    return ['#f59e0b', '#94a3b8', '#f97316', '#0f6cbd', '#7e22ce'][i] ?? '#0f6cbd';
  }
}

function pct(v: number, max: number): number {
  return max > 0 ? Math.round(v / max * 100) : 0;
}
