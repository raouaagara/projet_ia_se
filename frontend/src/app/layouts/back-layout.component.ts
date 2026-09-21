import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ChatbotComponent } from '../shared/chatbot.component';

@Component({
  selector: 'app-back-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatbotComponent, NgIf, NgFor],
  template: `

    <!-- ══════════════ ADMIN LAYOUT ══════════════ -->
    <div class="admin-root" *ngIf="isAdmin()">
      <header class="admin-nav">
        <div class="admin-nav-inner">
          <a class="admin-brand" routerLink="/back/dashboard">
            <span class="brand-chip"><img class="brand-logo" src="assets/logo.png" alt="Medicare"></span>
            <span class="brand-caption admin-brand-sub">Administration</span>
          </a>
          <nav class="admin-tabs">
            <a routerLink="/back/dashboard"          routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-chart-pie"></i><span>Dashboard</span></a>
            <a routerLink="/back/patients"           routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-users"></i><span>Patients</span></a>
            <a routerLink="/back/medecins"           routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-user-doctor"></i><span>Médecins</span></a>
            <a routerLink="/back/rendez-vous"        routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-calendar-check"></i><span>Rendez-vous</span></a>
            <a routerLink="/back/plannings"          routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-calendar-days"></i><span>Planning</span></a>
            <a routerLink="/back/consultations"      routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-stethoscope"></i><span>Consultations</span></a>
            <a routerLink="/back/examens"            routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-flask"></i><span>Examens</span></a>
            <a routerLink="/back/factures"           routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-file-invoice-dollar"></i><span>Factures</span></a>
            <a routerLink="/back/statistiques-detail"routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-chart-line"></i><span>Statistiques</span></a>
            <a routerLink="/back/utilisateurs"       routerLinkActive="admin-active" class="admin-tab"><i class="fa fa-shield-halved"></i><span>Utilisateurs</span></a>
          </nav>
          <div class="admin-right">
            <a routerLink="/front" class="admin-chip-sm" title="Espace patient"><i class="fa fa-arrow-up-right-from-square"></i></a>
            <a routerLink="/back/notifications" class="admin-chip-sm admin-notif" title="Notifications">
              <i class="fa fa-bell"></i>
              <span *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
            </a>
            <button class="admin-chip-sm" (click)="toggleDark()" [title]="dark?'Mode clair':'Mode sombre'">
              <i [class]="dark ? 'fa fa-sun' : 'fa fa-moon'"></i>
            </button>
            <a routerLink="/back/profil" class="admin-user">
              <div class="admin-av">{{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}</div>
              <div>
                <span class="admin-uname">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
                <span class="admin-urole">ADMIN</span>
              </div>
            </a>
            <button class="admin-logout" (click)="auth.logout()"><i class="fa fa-right-from-bracket"></i></button>
          </div>
          <button class="admin-burger" (click)="mob=!mob"><i [class]="mob?'fa fa-xmark':'fa fa-bars'"></i></button>
        </div>
        <div class="admin-drawer" *ngIf="mob">
          <a routerLink="/back/dashboard"    (click)="mob=false"><i class="fa fa-chart-pie"></i> Dashboard</a>
          <a routerLink="/back/patients"     (click)="mob=false"><i class="fa fa-users"></i> Patients</a>
          <a routerLink="/back/medecins"     (click)="mob=false"><i class="fa fa-user-doctor"></i> Médecins</a>
          <a routerLink="/back/rendez-vous"  (click)="mob=false"><i class="fa fa-calendar-check"></i> Rendez-vous</a>
          <a routerLink="/back/plannings"    (click)="mob=false"><i class="fa fa-calendar-days"></i> Planning</a>
          <a routerLink="/back/consultations"(click)="mob=false"><i class="fa fa-stethoscope"></i> Consultations</a>
          <a routerLink="/back/examens"      (click)="mob=false"><i class="fa fa-flask"></i> Examens</a>
          <a routerLink="/back/factures"     (click)="mob=false"><i class="fa fa-file-invoice-dollar"></i> Factures</a>
          <a routerLink="/back/statistiques-detail"(click)="mob=false"><i class="fa fa-chart-line"></i> Statistiques</a>
          <a routerLink="/back/notifications"(click)="mob=false"><i class="fa fa-bell"></i> Notifications</a>
          <a routerLink="/back/utilisateurs" (click)="mob=false"><i class="fa fa-shield-halved"></i> Utilisateurs</a>
          <button (click)="auth.logout()"><i class="fa fa-right-from-bracket"></i> Déconnexion</button>
        </div>
      </header>
      <main class="admin-main"><div class="admin-content"><router-outlet></router-outlet></div></main>
    </div>

    <!-- ══════════════ MÉDECIN LAYOUT — SIDEBAR ══════════════ -->
    <div class="med-root" *ngIf="isMedecin()">
      <aside class="med-sidebar" [class.collapsed]="collapsed">
        <!-- Brand -->
        <div class="med-brand">
          <span class="brand-chip" *ngIf="!collapsed"><img class="brand-logo" src="assets/logo.png" alt="Medicare"></span>
          <span class="brand-chip med-logo-mark" *ngIf="collapsed"><img src="assets/logo-mark.png" alt="Medicare"></span>
          <span class="brand-caption med-brand-sub" *ngIf="!collapsed">Espace Médecin</span>
        </div>
        <!-- User -->
        <a routerLink="/back/profil" class="med-user" *ngIf="!collapsed">
          <div class="med-user-av">{{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}</div>
          <div>
            <span class="med-user-name">Dr {{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
            <span class="med-user-role">Voir mon profil →</span>
          </div>
        </a>
        <!-- Nav -->
        <nav class="med-nav">
          <a routerLink="/back/dashboard"    routerLinkActive="med-active" class="med-link" [title]="collapsed?'Dashboard':''">
            <i class="fa fa-chart-pie"></i><span *ngIf="!collapsed">Dashboard</span>
          </a>
          <div class="med-sep" *ngIf="!collapsed">MES ACTIVITÉS</div>
          <a routerLink="/back/rendez-vous"  routerLinkActive="med-active" class="med-link" [title]="collapsed?'Mes RDV':''">
            <i class="fa fa-calendar-check"></i><span *ngIf="!collapsed">Mes rendez-vous</span>
          </a>
          <a routerLink="/back/plannings"    routerLinkActive="med-active" class="med-link" [title]="collapsed?'Planning':''">
            <i class="fa fa-calendar-days"></i><span *ngIf="!collapsed">Mon planning</span>
          </a>
          <a routerLink="/back/consultations"routerLinkActive="med-active" class="med-link" [title]="collapsed?'Consultations':''">
            <i class="fa fa-stethoscope"></i><span *ngIf="!collapsed">Consultations</span>
          </a>
          <a routerLink="/back/examens"      routerLinkActive="med-active" class="med-link" [title]="collapsed?'Examens':''">
            <i class="fa fa-flask"></i><span *ngIf="!collapsed">Examens</span>
          </a>
          <a routerLink="/back/patients"     routerLinkActive="med-active" class="med-link" [title]="collapsed?'Mes patients':''">
            <i class="fa fa-users"></i><span *ngIf="!collapsed">Mes patients</span>
          </a>
          <div class="med-sep" *ngIf="!collapsed">COMPTE</div>
          <a routerLink="/back/notifications"routerLinkActive="med-active" class="med-link med-notif-link" [title]="collapsed?'Notifications':''">
            <i class="fa fa-bell"></i><span *ngIf="!collapsed">Notifications</span>
            <span class="med-notif-dot" *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
          </a>
        </nav>
        <!-- Footer -->
        <div class="med-sidebar-footer">
          <button class="med-collapse" (click)="collapsed=!collapsed" [title]="collapsed?'Agrandir':'Réduire'">
            <i [class]="collapsed?'fa fa-chevron-right':'fa fa-chevron-left'"></i>
          </button>
          <button class="med-dark-btn" (click)="toggleDark()" *ngIf="!collapsed" [title]="dark?'Mode clair':'Mode sombre'">
            <i [class]="dark ? 'fa fa-sun' : 'fa fa-moon'"></i>
          </button>
          <button class="med-logout-btn" (click)="auth.logout()" [title]="collapsed?'Déconnexion':''">
            <i class="fa fa-right-from-bracket"></i>
            <span *ngIf="!collapsed">Déconnexion</span>
          </button>
        </div>
      </aside>
      <div class="med-body">
        <header class="med-topbar">
          <div class="med-topbar-title">{{ medPageTitle() }}</div>
          <div class="med-topbar-right">
            <span class="med-topbar-badge"><i class="fa fa-circle" style="font-size:8px;color:#22c55e"></i> Médecin</span>
          </div>
        </header>
        <main class="med-main"><div class="med-content"><router-outlet></router-outlet></div></main>
      </div>
    </div>

  `,
  styles: [`
    :host { display:block; }

    /* ══════════════ ADMIN STYLES ══════════════ */
    .admin-root { min-height:100vh; background:var(--bg,#f1f5f9); }

    .admin-nav {
      position:sticky; top:0; z-index:200;
      background:linear-gradient(90deg,#0a1628,#0f2a4a);
      box-shadow:0 2px 16px rgba(0,0,0,.2);
    }
    .admin-nav-inner {
      max-width:1700px; margin:0 auto; padding:0 20px;
      height:62px; display:flex; align-items:center; gap:4px;
    }
    .admin-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; margin-right:14px; }
    .admin-brand .brand-chip .brand-logo { height:28px; }
    .admin-brand-sub  { color:rgba(255,255,255,.55); }

    .admin-tabs { display:flex; gap:1px; flex:1; overflow-x:auto; scrollbar-width:none; }
    .admin-tabs::-webkit-scrollbar { display:none; }
    .admin-tab {
      display:flex; align-items:center; gap:6px;
      padding:7px 12px; border-radius:8px; font-size:12.5px; font-weight:600;
      color:rgba(255,255,255,.6); text-decoration:none; white-space:nowrap; transition:all .18s;
    }
    .admin-tab i { font-size:13px; }
    .admin-tab:hover { background:rgba(255,255,255,.1); color:#fff; }
    .admin-active { background:rgba(59,130,246,.3) !important; color:#93c5fd !important; }

    .admin-right { display:flex; align-items:center; gap:7px; margin-left:auto; flex-shrink:0; }
    .admin-chip-sm {
      width:34px; height:34px; border-radius:8px; border:1px solid rgba(255,255,255,.15);
      background:rgba(255,255,255,.08); color:rgba(255,255,255,.7); cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:13px;
      text-decoration:none; transition:all .18s; position:relative;
    }
    .admin-chip-sm:hover { background:rgba(255,255,255,.18); color:#fff; }
    .admin-notif span {
      position:absolute; top:-4px; right:-4px; min-width:16px; height:16px;
      border-radius:999px; background:#ef4444; color:#fff; font-size:9px; font-weight:800;
      display:flex; align-items:center; justify-content:center; padding:0 3px;
      border:2px solid #0a1628;
    }
    .admin-user {
      display:flex; align-items:center; gap:8px; text-decoration:none;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
      border-radius:999px; padding:4px 12px 4px 4px; transition:all .18s;
    }
    .admin-user:hover { background:rgba(255,255,255,.15); }
    .admin-av {
      width:28px; height:28px; border-radius:50%;
      background:linear-gradient(135deg,#3b82f6,#00b389);
      color:#fff; font-size:10px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .admin-uname { display:block; font-size:11.5px; font-weight:700; color:#fff; }
    .admin-urole { display:block; font-size:9.5px; color:rgba(255,255,255,.5); }
    .admin-logout {
      width:34px; height:34px; border-radius:8px; border:1px solid rgba(255,255,255,.15);
      background:transparent; color:rgba(255,255,255,.5); cursor:pointer; font-size:13px;
      display:flex; align-items:center; justify-content:center; transition:all .18s;
    }
    .admin-logout:hover { background:rgba(239,68,68,.2); color:#f87171; border-color:rgba(239,68,68,.4); }
    .admin-burger { display:none; background:transparent; border:none; cursor:pointer; font-size:20px; color:#fff; margin-left:auto; }
    .admin-drawer {
      padding:10px 20px 14px; display:flex; flex-direction:column; gap:2px;
      background:#0a1628; border-top:1px solid rgba(255,255,255,.1);
    }
    .admin-drawer a, .admin-drawer button {
      display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px;
      font-size:13.5px; font-weight:600; color:rgba(255,255,255,.65);
      background:none; border:none; cursor:pointer; text-decoration:none; transition:background .15s;
    }
    .admin-drawer a:hover, .admin-drawer button:hover { background:rgba(255,255,255,.1); color:#fff; }
    .admin-main { padding:28px 32px; }
    .admin-content { max-width:1700px; margin:0 auto; }

    /* ══════════════ MÉDECIN STYLES — SIDEBAR ══════════════ */
    .med-root { display:flex; min-height:100vh; background:#f0fdf4; }

    .med-sidebar {
      width:240px; flex-shrink:0; display:flex; flex-direction:column;
      background:linear-gradient(180deg,#064e3b 0%,#065f46 60%,#047857 100%);
      position:sticky; top:0; height:100vh; overflow-y:auto; overflow-x:hidden;
      transition:width .25s cubic-bezier(.4,0,.2,1);
    }
    .med-sidebar.collapsed { width:64px; }
    .med-sidebar::-webkit-scrollbar { width:3px; }
    .med-sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:99px; }

    .med-brand {
      display:flex; flex-direction:column; align-items:flex-start; gap:8px;
      padding:20px 16px 14px; border-bottom:1px solid rgba(255,255,255,.12); flex-shrink:0;
    }
    .med-sidebar.collapsed .med-brand { align-items:center; }
    .med-logo-mark { padding:4px; }
    .med-logo-mark img { display:block; width:30px; height:30px; object-fit:contain; }
    .med-brand-sub  { color:rgba(255,255,255,.6); }

    .med-user {
      display:flex; align-items:center; gap:10px;
      margin:12px; padding:10px 12px; border-radius:12px;
      background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
      text-decoration:none; transition:all .18s; overflow:hidden;
    }
    .med-user:hover { background:rgba(255,255,255,.18); }
    .med-user-av {
      width:34px; height:34px; border-radius:10px; flex-shrink:0;
      background:rgba(255,255,255,.3); color:#fff; font-size:13px; font-weight:900;
      display:flex; align-items:center; justify-content:center;
    }
    .med-user-name { display:block; font-size:12.5px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .med-user-role { display:block; font-size:10px; color:rgba(255,255,255,.6); }

    .med-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; }
    .med-sep {
      font-size:9px; font-weight:900; letter-spacing:.12em; color:rgba(255,255,255,.4);
      text-transform:uppercase; padding:12px 10px 4px; white-space:nowrap;
    }
    .med-link {
      display:flex; align-items:center; gap:10px;
      padding:10px 12px; border-radius:10px; font-size:13.5px; font-weight:600;
      color:rgba(255,255,255,.75); text-decoration:none; transition:all .18s;
      white-space:nowrap; position:relative;
    }
    .med-link i { font-size:15px; width:18px; text-align:center; flex-shrink:0; }
    .med-link:hover { background:rgba(255,255,255,.12); color:#fff; }
    .med-active { background:rgba(255,255,255,.2) !important; color:#fff !important; box-shadow:inset 3px 0 0 #6ee7b7; }
    .med-notif-link { justify-content:space-between; }
    .med-notif-dot {
      min-width:18px; height:18px; border-radius:999px; padding:0 4px;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .med-sidebar.collapsed .med-link span { display:none; }
    .med-sidebar.collapsed .med-notif-dot { position:absolute; top:6px; right:6px; width:10px; height:10px; min-width:unset; padding:0; }

    .med-sidebar-footer {
      padding:12px 8px; border-top:1px solid rgba(255,255,255,.12);
      display:flex; align-items:center; gap:6px; flex-shrink:0;
    }
    .med-collapse {
      width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,.15);
      background:transparent; color:rgba(255,255,255,.5); cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:11px; transition:all .18s; flex-shrink:0;
    }
    .med-collapse:hover { background:rgba(255,255,255,.12); color:#fff; }
    .med-dark-btn {
      width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,.15);
      background:transparent; color:rgba(255,255,255,.5); cursor:pointer;
      display:flex; align-items:center; justify-content:center; font-size:13px; transition:all .18s; flex-shrink:0;
    }
    .med-dark-btn:hover { background:rgba(255,255,255,.12); color:#fff; }
    .med-logout-btn {
      flex:1; display:flex; align-items:center; gap:8px; overflow:hidden;
      padding:8px 10px; border-radius:8px; border:none; cursor:pointer;
      background:transparent; color:rgba(255,255,255,.5); font-size:13px; font-weight:600;
      transition:all .18s; white-space:nowrap;
    }
    .med-logout-btn:hover { background:rgba(239,68,68,.15); color:#f87171; }

    .med-body { flex:1; display:flex; flex-direction:column; min-width:0; }
    .med-topbar {
      height:60px; background:#fff; border-bottom:2px solid #bbf7d0;
      display:flex; align-items:center; justify-content:space-between;
      padding:0 28px; flex-shrink:0; box-shadow:0 1px 8px rgba(34,197,94,.08);
    }
    .med-topbar-title { font-size:18px; font-weight:800; color:#064e3b; }
    .med-topbar-badge {
      display:flex; align-items:center; gap:6px;
      font-size:12px; font-weight:700; color:#15803d;
      background:#dcfce7; padding:5px 12px; border-radius:999px;
    }
    .med-main { padding:28px 32px; flex:1; }
    .med-content { max-width:1400px; margin:0 auto; }

    /* Mobile */
    @media(max-width:900px) {
      .admin-tabs, .admin-right { display:none; }
      .admin-burger { display:flex; }
      .med-sidebar { display:none; }
    }
  `]
})
export class BackLayoutComponent implements OnInit {
  dark = false;
  mob = false;
  collapsed = false;
  notifCount = 0;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    this.dark = saved === 'dark';
    document.documentElement.classList.toggle('dark', this.dark);
    this.loadNotifCount();
    // Polling toutes les 15 secondes pour les notifications temps réel
    setInterval(() => this.loadNotifCount(), 15000);
  }

  private loadNotifCount(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.countNotificationsNonLues(uid).subscribe({ next: (r: any) => this.notifCount = r?.count ?? 0, error: () => {} });
  }

  toggleDark(): void {
    this.dark = !this.dark;
    document.documentElement.classList.toggle('dark', this.dark);
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
  }

  isAdmin():      boolean { return this.auth.role() === 'ADMIN'; }
  isMedecin():    boolean { return this.auth.role() === 'MEDECIN'; }
  isSecretaire(): boolean { return this.auth.role() === 'SECRETAIRE'; }

  medPageTitle(): string {
    const url = window.location.pathname;
    const m: Record<string,string> = {
      '/back/dashboard':'Tableau de bord', '/back/rendez-vous':'Mes rendez-vous',
      '/back/plannings':'Mon planning', '/back/consultations':'Consultations',
      '/back/examens':'Examens & Analyses', '/back/patients':'Mes patients',
      '/back/notifications':'Notifications', '/back/profil':'Mon profil'
    };
    return m[url] ?? 'Espace Médecin';
  }
}
