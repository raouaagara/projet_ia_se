import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, RouterLink],
  template: `
    <div class="db">

      <!-- ══════════ WELCOME BANNER ══════════ -->
      <div class="db-banner">
        <div class="db-banner-left">
          <div class="db-greeting">{{ greeting() }}, <strong>{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</strong> 👋</div>
          <div class="db-date">{{ today }}</div>
          <div class="db-role-desc">{{ roleDesc() }}</div>
        </div>
        <div class="db-banner-right">
          <div class="db-banner-badge">{{ auth.role() }}</div>
          <div class="db-banner-stats">
            <div class="db-bstat" *ngFor="let b of bannerStats">
              <span class="db-bstat-v">{{ b.v }}</span>
              <span class="db-bstat-l">{{ b.l }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ KPI CARDS ══════════ -->
      <div class="db-kpis">
        <div class="db-kpi" *ngFor="let k of kpis">
          <div class="db-kpi-icon" [style.background]="k.bg" [style.color]="k.color">
            <i [class]="'fa '+k.icon"></i>
          </div>
          <div class="db-kpi-body">
            <div class="db-kpi-val">{{ k.value }}</div>
            <div class="db-kpi-lbl">{{ k.label }}</div>
            <div class="db-kpi-hint" *ngIf="k.hint">{{ k.hint }}</div>
          </div>
          <div class="db-kpi-trend" *ngIf="k.trend">
            <i class="fa fa-arrow-trend-up"></i>
          </div>
        </div>
      </div>

      <!-- ══════════ QUICK ACTIONS ══════════ -->
      <div class="db-section-label">ACTIONS RAPIDES</div>
      <div class="db-actions">
        <ng-container *ngIf="isMedecin()">
          <a routerLink="/back/rendez-vous"   class="db-act blue">  <i class="fa fa-calendar-check"></i><div><span>Mes rendez-vous</span><small>Voir et gérer</small></div></a>
          <a routerLink="/back/plannings"     class="db-act green"> <i class="fa fa-calendar-days"></i> <div><span>Mon planning</span><small>Calendrier mensuel</small></div></a>
          <a routerLink="/back/consultations" class="db-act purple"><i class="fa fa-stethoscope"></i>   <div><span>Consultations</span><small>Mes actes médicaux</small></div></a>
          <a routerLink="/back/patients"      class="db-act orange"><i class="fa fa-users"></i>         <div><span>Mes patients</span><small>Dossiers patients</small></div></a>
        </ng-container>
        <ng-container *ngIf="!isMedecin()">
          <a [routerLink]="prefix+'/patients'"      class="db-act blue">  <i class="fa fa-users"></i>         <div><span>Patients</span><small>{{ stats.patients || 0 }} inscrits</small></div></a>
          <a [routerLink]="prefix+'/rendez-vous'"   class="db-act green"> <i class="fa fa-calendar-check"></i><div><span>Rendez-vous</span><small>{{ stats.rendezVous || 0 }} total</small></div></a>
          <a [routerLink]="prefix+'/plannings'"     class="db-act teal">  <i class="fa fa-calendar-days"></i> <div><span>Planning</span><small>Calendrier</small></div></a>
          <a [routerLink]="prefix+'/consultations'" class="db-act purple"><i class="fa fa-stethoscope"></i>   <div><span>Consultations</span><small>{{ stats.consultations || 0 }} total</small></div></a>
          <a routerLink="/back/examens"       class="db-act violet" *ngIf="isAdmin()"><i class="fa fa-flask"></i>         <div><span>Examens</span><small>Laboratoire</small></div></a>
          <a routerLink="/back/laboratoire"   class="db-act teal2"  *ngIf="isAdmin()"><i class="fa fa-microscope"></i>    <div><span>Laboratoire</span><small>Saisir résultats</small></div></a>
          <a [routerLink]="prefix+'/factures'"      class="db-act yellow" *ngIf="isAdmin() || isSecretaire()"><i class="fa fa-file-invoice-dollar"></i><div><span>Factures</span><small>Paiements</small></div></a>
          <a routerLink="/back/medecins"      class="db-act orange" *ngIf="isAdmin()"><i class="fa fa-user-doctor"></i><div><span>Médecins</span><small>{{ stats.medecins || 0 }} actifs</small></div></a>
          <a routerLink="/back/statistiques-detail"  class="db-act indigo" *ngIf="isAdmin()"><i class="fa fa-chart-line"></i><div><span>Statistiques</span><small>Analyse détaillée</small></div></a>
          <a routerLink="/back/utilisateurs"  class="db-act red"    *ngIf="isAdmin()"><i class="fa fa-shield-halved"></i><div><span>Utilisateurs</span><small>Gestion des accès</small></div></a>
        </ng-container>
      </div>

      <!-- ══════════ ROW PRINCIPALE ══════════ -->
      <div class="db-row">

        <!-- RDV statuts -->
        <div class="db-card">
          <div class="db-card-head">
            <span class="db-card-title"><i class="fa fa-calendar-dot"></i> État des rendez-vous</span>
            <span class="db-card-total">{{ stats.rendezVous || 0 }} total</span>
          </div>
          <div class="db-rdv-list">
            <div class="db-rdv-row" *ngFor="let r of rdvStats">
              <div class="db-rdv-left">
                <span class="db-dot" [style.background]="r.color"></span>
                <span class="db-rdv-name">{{ r.label }}</span>
              </div>
              <div class="db-rdv-mid">
                <div class="db-bar-bg">
                  <div class="db-bar-fill" [style.background]="r.color" [style.width]="r.pct+'%'"></div>
                </div>
                <span class="db-pct">{{ r.pct }}%</span>
              </div>
              <span class="db-rdv-count" [style.color]="r.color">{{ r.value }}</span>
            </div>
          </div>
          <!-- Taux -->
          <div class="db-taux-row" *ngIf="!isMedecin()">
            <div class="db-taux">
              <div class="db-taux-v" style="color:#22c55e">{{ stats.tauxConfirmation || 0 }}%</div>
              <div class="db-taux-l">Taux confirmation</div>
            </div>
            <div class="db-taux">
              <div class="db-taux-v" style="color:#ef4444">{{ stats.tauxAnnulation || 0 }}%</div>
              <div class="db-taux-l">Taux annulation</div>
            </div>
            <div class="db-taux">
              <div class="db-taux-v" style="color:#0f6cbd">{{ stats.medecinsDisponibles || 0 }}</div>
              <div class="db-taux-l">Médecins dispo</div>
            </div>
          </div>
        </div>

        <!-- Prochains RDV -->
        <div class="db-card">
          <div class="db-card-head">
            <span class="db-card-title"><i class="fa fa-clock"></i> Prochains rendez-vous</span>
            <a [routerLink]="prefix+'/rendez-vous'" class="db-card-link">Voir tout <i class="fa fa-arrow-right"></i></a>
          </div>
          <div class="db-next-rdv">
            <div class="db-next-row" *ngFor="let r of nextRdvs">
              <div class="db-next-time">
                <span class="db-next-date">{{ r.dateHeure | slice:8:10 }}/{{ r.dateHeure | slice:5:7 }}</span>
                <span class="db-next-hour">{{ r.dateHeure | slice:11:16 }}</span>
              </div>
              <div class="db-next-avatar">{{ r.patientNom?.charAt(0) }}</div>
              <div class="db-next-info">
                <span class="db-next-name">{{ r.patientNom }}</span>
                <span class="db-next-motif">{{ r.motif || 'Consultation' }}</span>
              </div>
              <span class="db-next-badge" [class]="statusClass(r.statut)">{{ r.statut }}</span>
            </div>
            <div class="db-empty" *ngIf="nextRdvs.length === 0">
              <i class="fa fa-calendar-xmark"></i><p>Aucun RDV à venir</p>
            </div>
          </div>
        </div>

      </div>

      <!-- ══════════ ROW 2 ══════════ -->
      <div class="db-row">

        <!-- Médecins disponibles (admin) / Mon profil (médecin) -->
        <div class="db-card" *ngIf="!isMedecin()">
          <div class="db-card-head">
            <span class="db-card-title"><i class="fa fa-user-doctor"></i> Médecins disponibles</span>
            <a routerLink="/back/medecins" class="db-card-link" *ngIf="isAdmin()">Gérer <i class="fa fa-arrow-right"></i></a>
          </div>          <div class="db-doc-list">
            <div class="db-doc-row" *ngFor="let m of medecinsList">
              <div class="db-doc-av" [style.background]="specColor(m.specialite)">
                {{ m.prenom?.charAt(0) }}{{ m.nom?.charAt(0) }}
              </div>
              <div class="db-doc-info">
                <span class="db-doc-name">Dr {{ m.prenom }} {{ m.nom }}</span>
                <span class="db-doc-spec">{{ m.specialite }}</span>
              </div>
              <span class="db-doc-dispo" [class.dispo-yes]="m.disponible" [class.dispo-no]="!m.disponible">
                <i class="fa fa-circle"></i> {{ m.disponible ? 'Disponible' : 'Indispo.' }}
              </span>
            </div>
            <div class="db-empty" *ngIf="medecinsList.length === 0">
              <i class="fa fa-user-doctor"></i><p>Chargement...</p>
            </div>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="db-card">
          <div class="db-card-head">
            <span class="db-card-title"><i class="fa fa-activity"></i> Activité récente</span>
          </div>
          <div class="db-activity">
            <div class="db-act-row" *ngFor="let a of activities">
              <div class="db-act-icon" [style.background]="a.bg" [style.color]="a.color">
                <i [class]="'fa '+a.icon"></i>
              </div>
              <div class="db-act-text">
                <span class="db-act-msg">{{ a.msg }}</span>
                <span class="db-act-time">{{ a.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Activité récente remplace le widget MediCare supprimé -->

      </div>
    </div>
  `,
  styles: [`
    .db { display:flex; flex-direction:column; gap:28px; }

    /* ── BANNER ──────────────────────────────── */
    .db-banner {
      display:flex; align-items:stretch; justify-content:space-between; gap:24px;
      background:linear-gradient(135deg,#0f6cbd 0%,#00b389 100%);
      border-radius:20px; padding:28px 32px; color:#fff;
      box-shadow:0 8px 32px rgba(15,108,189,.3);
    }
    .db-greeting { font-size:26px; font-weight:700; margin-bottom:6px; }
    .db-greeting strong { font-weight:900; }
    .db-date { font-size:14px; color:rgba(255,255,255,.75); margin-bottom:4px; }
    .db-role-desc { font-size:13px; color:rgba(255,255,255,.6); }

    .db-banner-right { display:flex; flex-direction:column; align-items:flex-end; gap:16px; }
    .db-banner-badge {
      padding:6px 20px; border-radius:999px; font-size:12px; font-weight:800;
      background:rgba(255,255,255,.2); border:1.5px solid rgba(255,255,255,.3); letter-spacing:.08em;
    }
    .db-banner-stats { display:flex; gap:24px; }
    .db-bstat { text-align:center; }
    .db-bstat-v { display:block; font-size:22px; font-weight:900; color:#fff; }
    .db-bstat-l { display:block; font-size:11px; color:rgba(255,255,255,.65); margin-top:2px; }

    /* ── KPIs ────────────────────────────────── */
    .db-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
    .db-kpi {
      background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid var(--border,#e2e8f0);
      padding:22px 20px; display:flex; align-items:center; gap:16px;
      box-shadow:0 2px 10px rgba(0,0,0,.05); transition:all .22s;
    }
    .db-kpi:hover { transform:translateY(-4px); box-shadow:0 8px 28px rgba(0,0,0,.1); }
    .db-kpi-icon {
      width:52px; height:52px; border-radius:14px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:22px;
    }
    .db-kpi-val  { font-size:28px; font-weight:900; color:var(--text,#0f172a); line-height:1; }
    .db-kpi-lbl  { font-size:13px; color:var(--text-muted,#64748b); margin-top:4px; font-weight:600; }
    .db-kpi-hint { font-size:11.5px; color:var(--text-muted,#94a3b8); margin-top:2px; }
    .db-kpi-trend { margin-left:auto; color:#22c55e; font-size:18px; }

    /* ── SECTION LABEL ───────────────────────── */
    .db-section-label {
      font-size:11px; font-weight:900; letter-spacing:.1em;
      color:var(--text-muted,#94a3b8); text-transform:uppercase;
    }

    /* ── QUICK ACTIONS ───────────────────────── */
    .db-actions { display:flex; gap:12px; flex-wrap:wrap; }
    .db-act {
      display:flex; align-items:center; gap:14px;
      padding:16px 20px; border-radius:14px; font-size:14px; font-weight:700;
      text-decoration:none; transition:all .22s; flex:1; min-width:160px;
    }
    .db-act i { font-size:22px; flex-shrink:0; }
    .db-act span { display:block; font-weight:700; font-size:14px; }
    .db-act small { display:block; font-size:11.5px; font-weight:500; opacity:.7; margin-top:2px; }
    .db-act:hover { transform:translateY(-3px); box-shadow:0 8px 22px rgba(0,0,0,.12); }
    .db-act.teal2   { background:#e6faf5; color:#0d7a5f; }
    .db-act.teal2:hover { background:#0d7a5f; color:#fff; }
    .db-act.violet  { background:#f5f3ff; color:#6d28d9; }
    .db-act.violet:hover { background:#6d28d9; color:#fff; }
    .db-act.yellow  { background:#fefce8; color:#854d0e; }
    .db-act.yellow:hover { background:#854d0e; color:#fff; }
    .db-act.blue    { background:#dbeafe; color:#1d4ed8; }
    .db-act.blue:hover   { background:#1d4ed8; color:#fff; }
    .db-act.green   { background:#dcfce7; color:#15803d; }
    .db-act.green:hover  { background:#15803d; color:#fff; }
    .db-act.teal    { background:#e6faf5; color:#00876a; }
    .db-act.teal:hover   { background:#00876a; color:#fff; }
    .db-act.purple  { background:#f3e8ff; color:#7e22ce; }
    .db-act.purple:hover { background:#7e22ce; color:#fff; }
    .db-act.orange  { background:#fff7ed; color:#c2410c; }
    .db-act.orange:hover { background:#c2410c; color:#fff; }
    .db-act.indigo  { background:#eef2ff; color:#4338ca; }
    .db-act.indigo:hover { background:#4338ca; color:#fff; }
    .db-act.red     { background:#fff1f2; color:#be123c; }
    .db-act.red:hover    { background:#be123c; color:#fff; }

    /* ── ROWS ────────────────────────────────── */
    .db-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:900px) { .db-row { grid-template-columns:1fr; } }

    /* ── CARD ────────────────────────────────── */
    .db-card {
      background:var(--surface,#fff); border-radius:18px;
      border:1.5px solid var(--border,#e2e8f0);
      padding:24px; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .db-card-head {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:20px;
    }
    .db-card-title { font-size:15px; font-weight:800; color:var(--text,#0f172a); }
    .db-card-title i { color:#0f6cbd; margin-right:8px; }
    .db-card-total { font-size:12px; font-weight:600; color:var(--text-muted,#94a3b8); background:var(--bg,#f0f4f8); padding:4px 12px; border-radius:999px; }
    .db-card-link { font-size:12.5px; font-weight:700; color:#0f6cbd; text-decoration:none; display:flex; align-items:center; gap:5px; }
    .db-card-link:hover { gap:8px; }

    /* RDV list */
    .db-rdv-list { display:flex; flex-direction:column; gap:14px; margin-bottom:18px; }
    .db-rdv-row  { display:flex; align-items:center; gap:12px; }
    .db-rdv-left { display:flex; align-items:center; gap:8px; width:96px; flex-shrink:0; }
    .db-dot      { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .db-rdv-name { font-size:13.5px; color:var(--text,#0f172a); font-weight:600; }
    .db-rdv-mid  { display:flex; align-items:center; gap:8px; flex:1; }
    .db-bar-bg   { flex:1; height:7px; background:var(--border,#e2e8f0); border-radius:99px; overflow:hidden; }
    .db-bar-fill { height:100%; border-radius:99px; transition:width .6s ease; min-width:3px; }
    .db-pct      { font-size:11px; color:var(--text-muted,#94a3b8); width:30px; text-align:right; }
    .db-rdv-count{ font-size:14px; font-weight:800; width:24px; text-align:right; }

    .db-taux-row { display:flex; gap:0; border-top:1.5px solid var(--border,#f1f5f9); padding-top:16px; }
    .db-taux     { flex:1; text-align:center; }
    .db-taux:not(:last-child) { border-right:1.5px solid var(--border,#f1f5f9); }
    .db-taux-v   { font-size:22px; font-weight:900; }
    .db-taux-l   { font-size:11.5px; color:var(--text-muted,#94a3b8); margin-top:3px; font-weight:500; }

    /* Next RDV */
    .db-next-rdv { display:flex; flex-direction:column; gap:10px; }
    .db-next-row {
      display:flex; align-items:center; gap:12px;
      padding:12px 14px; border-radius:12px;
      background:var(--bg,#f8fafc); border:1px solid var(--border,#f1f5f9);
      transition:background .15s;
    }
    .db-next-row:hover { background:var(--border,#f1f5f9); }
    .db-next-time { display:flex; flex-direction:column; align-items:center; min-width:40px; }
    .db-next-date { font-size:12px; font-weight:700; color:var(--text,#0f172a); }
    .db-next-hour { font-size:13px; font-weight:800; color:#0f6cbd; }
    .db-next-avatar {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:14px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .db-next-info { flex:1; min-width:0; }
    .db-next-name  { display:block; font-size:13.5px; font-weight:700; color:var(--text,#0f172a); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .db-next-motif { display:block; font-size:12px; color:var(--text-muted,#94a3b8); }
    .db-next-badge {
      padding:3px 10px; border-radius:6px; font-size:11.5px; font-weight:700; flex-shrink:0;
    }
    .planifie { background:#dbeafe; color:#1d4ed8; }
    .confirme { background:#dcfce7; color:#15803d; }
    .annule   { background:#fee2e2; color:#b91c1c; }
    .termine  { background:#f1f5f9; color:#64748b; }

    /* Médecins list */
    .db-doc-list { display:flex; flex-direction:column; gap:10px; }
    .db-doc-row  {
      display:flex; align-items:center; gap:12px;
      padding:10px 12px; border-radius:12px;
      border:1px solid var(--border,#f1f5f9); transition:background .15s;
    }
    .db-doc-row:hover { background:var(--bg,#f8fafc); }
    .db-doc-av {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      color:#fff; font-size:14px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .db-doc-info { flex:1; min-width:0; }
    .db-doc-name { display:block; font-size:13.5px; font-weight:700; color:var(--text,#0f172a); }
    .db-doc-spec { display:block; font-size:12px; color:var(--text-muted,#94a3b8); }
    .db-doc-dispo {
      display:inline-flex; align-items:center; gap:5px;
      padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:700;
    }
    .dispo-yes { background:#dcfce7; color:#15803d; }
    .dispo-no  { background:#fee2e2; color:#b91c1c; }

    /* Activity */
    .db-activity { display:flex; flex-direction:column; gap:12px; }
    .db-act-row  { display:flex; align-items:center; gap:12px; }
    .db-act-icon {
      width:38px; height:38px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:15px;
    }
    .db-act-text { flex:1; }
    .db-act-msg  { display:block; font-size:13.5px; font-weight:600; color:var(--text,#0f172a); }
    .db-act-time { display:block; font-size:11.5px; color:var(--text-muted,#94a3b8); margin-top:2px; }

    /* Info block */
    .db-info-block { display:flex; flex-direction:column; gap:18px; }
    .db-info-logo  { display:flex; align-items:center; gap:14px; }
    .db-info-icon  {
      width:50px; height:50px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px;
    }
    .db-info-name { font-size:16px; font-weight:800; color:var(--text,#0f172a); }
    .db-info-sub  { font-size:12px; color:var(--text-muted,#94a3b8); margin-top:2px; }
    .db-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .db-info-item {
      display:flex; align-items:center; gap:8px;
      padding:10px 12px; border-radius:10px;
      background:var(--bg,#f8fafc); border:1px solid var(--border,#f1f5f9);
      font-size:13px; color:var(--text,#0f172a); font-weight:600;
    }
    .db-info-item i { color:#0f6cbd; font-size:14px; }
    .db-status-badges { display:flex; flex-wrap:wrap; gap:8px; }
    .db-sbadge {
      display:inline-flex; align-items:center; gap:6px;
      padding:5px 12px; border-radius:8px; font-size:12px; font-weight:700;
    }
    .db-sbadge.green  { background:#dcfce7; color:#15803d; }
    .db-sbadge.blue   { background:#dbeafe; color:#1d4ed8; }
    .db-sbadge.purple { background:#f3e8ff; color:#7e22ce; }

    /* Empty */
    .db-empty { text-align:center; padding:28px; color:var(--text-muted,#94a3b8); }
    .db-empty i { font-size:28px; display:block; margin-bottom:8px; }
    .db-empty p { font-size:13px; margin:0; }

    /* Row of 3 */
    .db-row:last-child { grid-template-columns:1fr 1fr 1fr; }
    @media(max-width:1100px) { .db-row:last-child { grid-template-columns:1fr 1fr; } }
    @media(max-width:700px)  { .db-row:last-child { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  kpis: any[] = [];
  rdvStats: any[] = [];
  nextRdvs: any[] = [];
  medecinsList: any[] = [];
  bannerStats: any[] = [];
  activities: any[] = [];

  today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    if (this.isMedecin()) {
      this.loadMedecinDashboard();
    } else {
      this.loadAdminDashboard();
    }
  }

  private loadAdminDashboard(): void {
    this.api.stats().subscribe(s => {
      this.stats = s;
      this.buildKpis(s);
      this.buildRdvStats(s);
    });

    this.api.rdvs().subscribe(r => {
      const now = new Date().toISOString();
      this.nextRdvs = r
        .filter((x: any) => x.dateHeure > now && x.statut !== 'ANNULE')
        .sort((a: any, b: any) => a.dateHeure.localeCompare(b.dateHeure))
        .slice(0, 6);
      this.activities = r.slice(0, 5).map((x: any) => ({
        icon: 'fa-calendar-check', bg: '#dbeafe', color: '#1d4ed8',
        msg: `RDV ${x.statut?.toLowerCase()} — ${x.patientNom}`,
        time: x.dateHeure?.slice(0, 16).replace('T', ' ')
      }));
    });

    this.api.medecins().subscribe(m => this.medecinsList = m.slice(0, 6));
  }

  private loadMedecinDashboard(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;

    // Récupérer le profil médecin lié à cet utilisateur
    this.api.medecinByUser(uid).subscribe({
      next: (medecin) => {
        if (!medecin?.id) {
          // Pas de profil médecin lié — afficher zéros
          this.buildMedecinStats([], [], []);
          return;
        }

        // Charger les données propres à CE médecin
        this.api.rdvsMedecin(medecin.id).subscribe(rdvs => {
          this.api.consultationsMedecin(medecin.id).subscribe(consultations => {
            this.api.patientsByMedecin(medecin.id).subscribe(patients => {
              this.buildMedecinStats(rdvs, consultations, patients);
            });
          });

          // Prochains RDV de CE médecin
          const now = new Date().toISOString();
          this.nextRdvs = rdvs
            .filter((x: any) => x.dateHeure > now && x.statut !== 'ANNULE')
            .sort((a: any, b: any) => a.dateHeure.localeCompare(b.dateHeure))
            .slice(0, 6);

          // Activité récente
          this.activities = rdvs.slice(0, 5).map((x: any) => ({
            icon: 'fa-calendar-check', bg: '#dbeafe', color: '#1d4ed8',
            msg: `RDV ${x.statut?.toLowerCase()} — ${x.patientNom}`,
            time: x.dateHeure?.slice(0, 16).replace('T', ' ')
          }));
        });
      },
      error: () => {
        // Pas de profil médecin — tout à zéro
        this.buildMedecinStats([], [], []);
      }
    });
  }

  private buildMedecinStats(rdvs: any[], consultations: any[], patients: any[]): void {
    const planifies = rdvs.filter(r => r.statut === 'PLANIFIE').length;
    const confirmes = rdvs.filter(r => r.statut === 'CONFIRME').length;
    const annules   = rdvs.filter(r => r.statut === 'ANNULE').length;
    const termines  = rdvs.filter(r => r.statut === 'TERMINE').length;
    const total     = rdvs.length;

    this.stats = {
      patients:            patients.length,
      rendezVous:          total,
      consultations:       consultations.length,
      rendezVousPlanifies: planifies,
      rendezVousConfirmes: confirmes,
      rendezVousAnnules:   annules,
      rendezVousTermines:  termines,
    };

    this.bannerStats = [
      { v: total,                l: 'RDV total' },
      { v: consultations.length, l: 'Consultations' },
      { v: patients.length,      l: 'Patients' },
    ];

    this.kpis = [
      { label:'Mes patients',      value: patients.length,      icon:'fa-users',          bg:'#dbeafe', color:'#1d4ed8', trend: patients.length > 0 },
      { label:'Mes rendez-vous',   value: total,                icon:'fa-calendar-check', bg:'#dcfce7', color:'#15803d', trend: total > 0 },
      { label:'Mes consultations', value: consultations.length, icon:'fa-stethoscope',    bg:'#f3e8ff', color:'#7e22ce' },
      { label:'RDV planifiés',     value: planifies,            icon:'fa-clock',          bg:'#fff7ed', color:'#c2410c' },
    ];

    this.buildRdvStats(this.stats);
  }

  private buildKpis(s: any): void {
    this.bannerStats = [
      { v: s.patients || 0,     l: 'Patients' },
      { v: s.medecins || 0,     l: 'Médecins' },
      { v: s.rendezVous || 0,   l: 'RDV' },
      { v: s.consultations || 0,l: 'Consultations' },
    ];
    this.kpis = [
      { label:'Patients inscrits',  value:s.patients||0,            icon:'fa-users',          bg:'#dbeafe', color:'#1d4ed8', trend:true },
      { label:'Médecins',           value:s.medecins||0,            icon:'fa-user-doctor',    bg:'#dcfce7', color:'#15803d', hint:`${s.medecinsDisponibles||0} disponibles` },
      { label:'Rendez-vous',        value:s.rendezVous||0,          icon:'fa-calendar-check', bg:'#fff7ed', color:'#c2410c', trend:true },
      { label:'Consultations',      value:s.consultations||0,       icon:'fa-stethoscope',    bg:'#f3e8ff', color:'#7e22ce' },
      { label:'RDV planifiés',      value:s.rendezVousPlanifies||0, icon:'fa-clock',          bg:'#fef9c3', color:'#854d0e' },
      { label:'RDV confirmés',      value:s.rendezVousConfirmes||0, icon:'fa-circle-check',   bg:'#dcfce7', color:'#15803d' },
      { label:'Utilisateurs',       value:s.utilisateurs||0,        icon:'fa-shield-halved',  bg:'#f0fdf4', color:'#166534' },
      { label:'Taux confirmation',  value:(s.tauxConfirmation||0)+'%', icon:'fa-chart-line',  bg:'#e0f2fe', color:'#0369a1' },
    ];
  }

  private buildRdvStats(s: any): void {
    const total = s.rendezVous || 1;
    const pct = (v: number) => Math.round(v / total * 100);
    this.rdvStats = [
      { label:'Planifiés', value:s.rendezVousPlanifies||0, color:'#3b82f6', pct:pct(s.rendezVousPlanifies||0) },
      { label:'Confirmés', value:s.rendezVousConfirmes||0, color:'#22c55e', pct:pct(s.rendezVousConfirmes||0) },
      { label:'Terminés',  value:s.rendezVousTermines||0,  color:'#f59e0b', pct:pct(s.rendezVousTermines||0)  },
      { label:'Annulés',   value:s.rendezVousAnnules||0,   color:'#ef4444', pct:pct(s.rendezVousAnnules||0)   },
    ];
  }

  isMedecin(): boolean { return this.auth.role() === 'MEDECIN'; }
  isAdmin():   boolean { return this.auth.role() === 'ADMIN'; }
  isSecretaire(): boolean { return this.auth.role() === 'SECRETAIRE'; }

  /** Préfixe de route selon le rôle */
  get prefix(): string { return this.isSecretaire() ? '/secretaire' : '/back'; }

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  roleDesc(): string {
    if (this.isMedecin()) return 'Bienvenue dans votre espace médecin — gérez vos consultations et rendez-vous.';
    if (this.auth.role() === 'SECRETAIRE') return 'Bienvenue — gérez les rendez-vous et les plannings.';
    return 'Vue d\'ensemble de toute l\'activité de la clinique.';
  }

  specColor(spec: string): string {
    const m: Record<string,string> = {
      'Cardiologie':'#ef4444','Neurologie':'#9333ea','chirurgien':'#0f6cbd',
      'Orthopédie':'#f59e0b','Pédiatrie':'#db2777','Médecine Gén.':'#22c55e',
    };
    return m[spec] ?? '#0f6cbd';
  }

  statusClass(s: string): string { return (s||'').toLowerCase(); }
}
