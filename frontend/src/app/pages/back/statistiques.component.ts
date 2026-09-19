import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe],
  template: `
    <div class="stats-page">

      <!-- HEADER -->
      <div class="stats-header">
        <div>
          <h2 class="stats-title"><i class="fa fa-chart-line"></i> Statistiques</h2>
          <p class="stats-sub">Vue d'ensemble en temps réel de la clinique</p>
        </div>
        <button class="stats-refresh" (click)="load()" [class.spinning]="loading">
          <i class="fa fa-rotate"></i>
        </button>
      </div>

      <!-- SKELETON -->
      <div *ngIf="loading" class="stats-skeleton">
        <div class="sk-card" *ngFor="let x of [1,2,3,4,5,6,7,8]"></div>
      </div>

      <ng-container *ngIf="!loading && s">

        <!-- ROW 1 — KPI PRINCIPAUX -->
        <div class="stats-grid-4">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon"><i class="fa fa-users"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">{{ s.patients }}</div>
              <div class="kpi-label">Patients</div>
            </div>
            <div class="kpi-trend up"><i class="fa fa-arrow-trend-up"></i></div>
          </div>

          <div class="kpi-card kpi-green">
            <div class="kpi-icon"><i class="fa fa-user-doctor"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">{{ s.medecins }}</div>
              <div class="kpi-label">Médecins</div>
              <div class="kpi-sub">{{ s.medecinsDisponibles }} disponibles</div>
            </div>
            <div class="kpi-progress">
              <div class="kpi-bar" [style.width]="(s.medecins > 0 ? s.medecinsDisponibles/s.medecins*100 : 0) + '%'" style="background:#22c55e"></div>
            </div>
          </div>

          <div class="kpi-card kpi-purple">
            <div class="kpi-icon"><i class="fa fa-calendar-check"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">{{ s.rendezVous }}</div>
              <div class="kpi-label">Rendez-vous</div>
            </div>
            <div class="kpi-trend up"><i class="fa fa-arrow-trend-up"></i></div>
          </div>

          <div class="kpi-card kpi-orange">
            <div class="kpi-icon"><i class="fa fa-stethoscope"></i></div>
            <div class="kpi-body">
              <div class="kpi-value">{{ s.consultations }}</div>
              <div class="kpi-label">Consultations</div>
            </div>
            <div class="kpi-trend up"><i class="fa fa-arrow-trend-up"></i></div>
          </div>
        </div>

        <!-- ROW 2 — STATUTS RDV + TAUX -->
        <div class="stats-grid-2">

          <!-- Statuts RDV -->
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-title"><i class="fa fa-circle-dot"></i> Statuts des rendez-vous</span>
              <span class="stat-card-total">{{ s.rendezVous }} total</span>
            </div>
            <div class="statut-list">
              <div class="statut-row">
                <div class="statut-left">
                  <span class="statut-dot" style="background:#3b82f6"></span>
                  <span>Planifiés</span>
                </div>
                <div class="statut-right">
                  <div class="statut-bar-wrap">
                    <div class="statut-bar-fill" style="background:#3b82f6"
                         [style.width]="pct(s.rendezVousPlanifies, s.rendezVous) + '%'"></div>
                  </div>
                  <span class="statut-count">{{ s.rendezVousPlanifies }}</span>
                </div>
              </div>
              <div class="statut-row">
                <div class="statut-left">
                  <span class="statut-dot" style="background:#22c55e"></span>
                  <span>Confirmés</span>
                </div>
                <div class="statut-right">
                  <div class="statut-bar-wrap">
                    <div class="statut-bar-fill" style="background:#22c55e"
                         [style.width]="pct(s.rendezVousConfirmes, s.rendezVous) + '%'"></div>
                  </div>
                  <span class="statut-count">{{ s.rendezVousConfirmes }}</span>
                </div>
              </div>
              <div class="statut-row">
                <div class="statut-left">
                  <span class="statut-dot" style="background:#f59e0b"></span>
                  <span>Terminés</span>
                </div>
                <div class="statut-right">
                  <div class="statut-bar-wrap">
                    <div class="statut-bar-fill" style="background:#f59e0b"
                         [style.width]="pct(s.rendezVousTermines, s.rendezVous) + '%'"></div>
                  </div>
                  <span class="statut-count">{{ s.rendezVousTermines }}</span>
                </div>
              </div>
              <div class="statut-row">
                <div class="statut-left">
                  <span class="statut-dot" style="background:#ef4444"></span>
                  <span>Annulés</span>
                </div>
                <div class="statut-right">
                  <div class="statut-bar-wrap">
                    <div class="statut-bar-fill" style="background:#ef4444"
                         [style.width]="pct(s.rendezVousAnnules, s.rendezVous) + '%'"></div>
                  </div>
                  <span class="statut-count">{{ s.rendezVousAnnules }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Taux -->
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-title"><i class="fa fa-gauge-high"></i> Indicateurs qualité</span>
            </div>
            <div class="taux-grid">
              <div class="taux-item taux-green">
                <div class="taux-circle" style="--p:{{ s.tauxConfirmation }};--c:#22c55e">
                  <svg viewBox="0 0 36 36">
                    <path class="taux-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="taux-fg" stroke="#22c55e"
                          [attr.stroke-dasharray]="s.tauxConfirmation + ', 100'"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <span>{{ s.tauxConfirmation }}%</span>
                </div>
                <div class="taux-label">Taux de<br>confirmation</div>
              </div>
              <div class="taux-item taux-red">
                <div class="taux-circle">
                  <svg viewBox="0 0 36 36">
                    <path class="taux-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="taux-fg" stroke="#ef4444"
                          [attr.stroke-dasharray]="s.tauxAnnulation + ', 100'"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <span>{{ s.tauxAnnulation }}%</span>
                </div>
                <div class="taux-label">Taux<br>d'annulation</div>
              </div>
              <div class="taux-item taux-blue">
                <div class="taux-val">{{ s.utilisateurs }}</div>
                <div class="taux-label">Comptes<br>utilisateurs</div>
              </div>
              <div class="taux-item taux-purple">
                <div class="taux-val">{{ s.medecins > 0 ? (s.consultations / s.medecins | number:'1.1-1') : 0 }}</div>
                <div class="taux-label">Consultations<br>/ médecin</div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .stats-page { padding: 4px 0; }

    .stats-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .stats-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: var(--text); }
    .stats-title i { color: var(--primary); margin-right: 8px; }
    .stats-sub { font-size: 13px; color: var(--text-muted); margin: 0; }

    .stats-refresh {
      width: 38px; height: 38px; border-radius: 10px;
      border: 1.5px solid var(--border); background: var(--surface);
      color: var(--text-muted); cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .stats-refresh:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    .stats-refresh.spinning i { animation: spin .6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Skeleton */
    .stats-skeleton { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 20px; }
    .sk-card {
      height: 110px; border-radius: 16px;
      background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Grid layouts */
    .stats-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 20px; }
    .stats-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* KPI CARDS */
    .kpi-card {
      border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 14px;
      position: relative; overflow: hidden; border: 1.5px solid transparent;
      background: var(--surface); box-shadow: 0 2px 12px rgba(0,0,0,.06);
      flex-wrap: wrap;
    }
    .kpi-card::before {
      content: ''; position: absolute; inset: 0; opacity: .07; border-radius: 16px;
    }
    .kpi-blue::before  { background: #3b82f6; }
    .kpi-green::before { background: #22c55e; }
    .kpi-purple::before{ background: #a855f7; }
    .kpi-orange::before{ background: #f59e0b; }

    .kpi-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; color: #fff;
    }
    .kpi-blue   .kpi-icon { background: #3b82f6; }
    .kpi-green  .kpi-icon { background: #22c55e; }
    .kpi-purple .kpi-icon { background: #a855f7; }
    .kpi-orange .kpi-icon { background: #f59e0b; }

    .kpi-body { flex: 1; min-width: 0; }
    .kpi-value { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1.1; }
    .kpi-label { font-size: 12.5px; color: var(--text-muted); font-weight: 500; margin-top: 2px; }
    .kpi-sub   { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
    .kpi-progress { width: 100%; height: 4px; background: var(--border); border-radius: 99px; margin-top: 8px; overflow: hidden; }
    .kpi-bar { height: 100%; border-radius: 99px; transition: width .6s ease; }
    .kpi-trend { font-size: 14px; color: #22c55e; margin-left: auto; }

    /* STAT CARD */
    .stat-card {
      background: var(--surface); border-radius: 16px;
      border: 1.5px solid var(--border); padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }
    .stat-card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px;
    }
    .stat-card-title { font-size: 14px; font-weight: 600; color: var(--text); }
    .stat-card-title i { color: var(--primary); margin-right: 6px; }
    .stat-card-total { font-size: 12px; color: var(--text-muted); background: var(--bg); padding: 3px 10px; border-radius: 99px; }

    /* Statuts */
    .statut-list { display: flex; flex-direction: column; gap: 12px; }
    .statut-row { display: flex; align-items: center; gap: 12px; }
    .statut-left { display: flex; align-items: center; gap: 8px; width: 90px; font-size: 13px; color: var(--text); flex-shrink: 0; }
    .statut-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .statut-right { display: flex; align-items: center; gap: 10px; flex: 1; }
    .statut-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 99px; overflow: hidden; }
    .statut-bar-fill { height: 100%; border-radius: 99px; transition: width .6s ease; min-width: 2px; }
    .statut-count { font-size: 13px; font-weight: 600; color: var(--text); width: 24px; text-align: right; }

    /* Taux */
    .taux-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .taux-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; background: var(--bg); }

    .taux-circle { position: relative; width: 80px; height: 80px; }
    .taux-circle svg { transform: rotate(-90deg); }
    .taux-circle span {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 700; color: var(--text);
    }
    .taux-bg { fill: none; stroke: var(--border); stroke-width: 3; }
    .taux-fg { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray .8s ease; }

    .taux-val { font-size: 30px; font-weight: 800; color: var(--text); line-height: 1; padding: 10px 0 4px; }
    .taux-label { font-size: 11.5px; color: var(--text-muted); text-align: center; font-weight: 500; line-height: 1.4; }

    @media (max-width: 1100px) {
      .stats-grid-4 { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 700px) {
      .stats-grid-4, .stats-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class StatistiquesComponent implements OnInit {
  s: any = null;
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.stats().subscribe({
      next: (s) => { this.s = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  pct(val: number, total: number): number {
    return total > 0 ? Math.round(val / total * 100) : 0;
  }
}
