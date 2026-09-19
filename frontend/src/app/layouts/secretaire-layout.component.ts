import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ChatbotComponent } from '../shared/chatbot.component';

@Component({
  selector: 'app-secretaire-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, ChatbotComponent],
  template: `
    <div class="sl-root">

      <!-- ══ SIDEBAR GAUCHE ══════════════════════════════════════════ -->
      <aside class="sl-sidebar">

        <!-- Logo -->
        <div class="sl-brand">
          <div class="sl-logo"><i class="fa fa-briefcase"></i></div>
          <div>
            <div class="sl-brand-name">MediCare</div>
            <div class="sl-brand-role">Secrétariat</div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sl-nav">
          <div class="sl-nav-section">PRINCIPAL</div>
          <a routerLink="/secretaire/dashboard"   routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-chart-pie"></i><span>Tableau de bord</span>
          </a>
          <a routerLink="/secretaire/rendez-vous" routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-calendar-check"></i><span>Rendez-vous</span>
            <span class="sl-badge" *ngIf="rdvCount > 0">{{ rdvCount }}</span>
          </a>
          <a routerLink="/secretaire/plannings"   routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-calendar-days"></i><span>Planning</span>
          </a>
          <a routerLink="/secretaire/patients"    routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-users"></i><span>Patients</span>
          </a>

          <div class="sl-nav-section">MÉDICAL</div>
          <a routerLink="/secretaire/consultations" routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-stethoscope"></i><span>Consultations</span>
          </a>
          <a routerLink="/secretaire/factures"    routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-file-invoice-dollar"></i><span>Factures</span>
          </a>

          <div class="sl-nav-section">COMPTE</div>
          <a routerLink="/secretaire/notifications" routerLinkActive="sl-active" class="sl-link sl-link-notif">
            <i class="fa fa-bell"></i><span>Notifications</span>
            <span class="sl-notif-dot" *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
          </a>
          <a routerLink="/secretaire/profil"      routerLinkActive="sl-active" class="sl-link">
            <i class="fa fa-user-gear"></i><span>Mon profil</span>
          </a>
        </nav>

        <!-- User card bas -->
        <div class="sl-user-card">
          <div class="sl-user-av">
            {{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}
          </div>
          <div class="sl-user-info">
            <span class="sl-user-name">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
            <span class="sl-user-role">Secrétaire médicale</span>
          </div>
          <button class="sl-logout" (click)="auth.logout()" title="Déconnexion">
            <i class="fa fa-right-from-bracket"></i>
          </button>
        </div>
      </aside>

      <!-- ══ MAIN ══════════════════════════════════════════════════════ -->
      <div class="sl-main-wrap">

        <!-- Topbar -->
        <header class="sl-topbar">
          <button class="sl-burger" (click)="sidebarOpen=!sidebarOpen">
            <i [class]="sidebarOpen ? 'fa fa-xmark' : 'fa fa-bars'"></i>
          </button>
          <div class="sl-topbar-title">{{ pageTitle() }}</div>
          <div class="sl-topbar-right">
            <button class="sl-tb-btn" (click)="toggleDark()" [title]="dark?'Mode clair':'Mode sombre'">
              <i [class]="dark ? 'fa fa-sun' : 'fa fa-moon'"></i>
            </button>
            <a routerLink="/secretaire/notifications" class="sl-tb-btn sl-tb-notif">
              <i class="fa fa-bell"></i>
              <span class="sl-notif-dot" *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
            </a>
          </div>
        </header>

        <!-- Overlay mobile -->
        <div class="sl-overlay" *ngIf="sidebarOpen" (click)="sidebarOpen=false"></div>

        <!-- Mobile sidebar -->
        <aside class="sl-sidebar sl-sidebar-mobile" [class.open]="sidebarOpen">
          <div class="sl-brand">
            <div class="sl-logo"><i class="fa fa-briefcase"></i></div>
            <div>
              <div class="sl-brand-name">MediCare</div>
              <div class="sl-brand-role">Secrétariat</div>
            </div>
          </div>
          <nav class="sl-nav">
            <a routerLink="/secretaire/dashboard"    (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-chart-pie"></i><span>Dashboard</span></a>
            <a routerLink="/secretaire/rendez-vous"  (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-calendar-check"></i><span>Rendez-vous</span></a>
            <a routerLink="/secretaire/plannings"    (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-calendar-days"></i><span>Planning</span></a>
            <a routerLink="/secretaire/patients"     (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-users"></i><span>Patients</span></a>
            <a routerLink="/secretaire/consultations"(click)="sidebarOpen=false" class="sl-link"><i class="fa fa-stethoscope"></i><span>Consultations</span></a>
            <a routerLink="/secretaire/factures"     (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-file-invoice-dollar"></i><span>Factures</span></a>
            <a routerLink="/secretaire/notifications"(click)="sidebarOpen=false" class="sl-link"><i class="fa fa-bell"></i><span>Notifications</span></a>
            <a routerLink="/secretaire/profil"       (click)="sidebarOpen=false" class="sl-link"><i class="fa fa-user-gear"></i><span>Profil</span></a>
            <button (click)="auth.logout()" class="sl-link" style="border:none;background:none;cursor:pointer;width:100%">
              <i class="fa fa-right-from-bracket"></i><span>Déconnexion</span>
            </button>
          </nav>
        </aside>

        <!-- Content -->
        <main class="sl-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    :host { display:block; }

    .sl-root {
      display:flex; min-height:100vh;
      background:var(--bg,#fff7ed);
      font-family:'Inter','Plus Jakarta Sans',sans-serif;
    }

    /* ── SIDEBAR ─────────────────────────────────────── */
    .sl-sidebar {
      width:260px; flex-shrink:0; display:flex; flex-direction:column;
      background:linear-gradient(180deg,#ea580c 0%,#c2410c 100%);
      position:sticky; top:0; height:100vh; overflow-y:auto;
    }
    .sl-sidebar-mobile {
      position:fixed; left:-260px; top:0; height:100%; z-index:300;
      transition:left .3s ease; display:none;
    }
    .sl-sidebar-mobile.open { left:0; }

    .sl-brand {
      display:flex; align-items:center; gap:12px;
      padding:22px 20px 18px; border-bottom:1px solid rgba(255,255,255,.15);
    }
    .sl-logo {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      background:rgba(255,255,255,.2); border:1.5px solid rgba(255,255,255,.3);
      display:flex; align-items:center; justify-content:center;
      font-size:17px; color:#fff;
    }
    .sl-brand-name { font-size:15px; font-weight:900; color:#fff; }
    .sl-brand-role { font-size:11px; color:rgba(255,255,255,.7); margin-top:1px; }

    .sl-nav { flex:1; padding:12px 12px; display:flex; flex-direction:column; gap:2px; }
    .sl-nav-section {
      font-size:9.5px; font-weight:800; letter-spacing:.1em;
      color:rgba(255,255,255,.5); text-transform:uppercase;
      padding:10px 8px 4px; margin-top:6px;
    }
    .sl-link {
      display:flex; align-items:center; gap:10px;
      padding:10px 12px; border-radius:10px;
      font-size:13.5px; font-weight:600; color:rgba(255,255,255,.8);
      text-decoration:none; transition:all .18s; position:relative;
    }
    .sl-link i { font-size:15px; width:18px; text-align:center; flex-shrink:0; }
    .sl-link:hover { background:rgba(255,255,255,.15); color:#fff; }
    .sl-active { background:rgba(255,255,255,.2) !important; color:#fff !important;
      box-shadow:inset 3px 0 0 #fff; }
    .sl-badge {
      margin-left:auto; min-width:20px; height:20px; border-radius:999px; padding:0 5px;
      background:rgba(255,255,255,.25); color:#fff;
      font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center;
    }
    .sl-notif-dot {
      margin-left:auto; min-width:18px; height:18px; border-radius:999px; padding:0 5px;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center;
    }

    .sl-user-card {
      display:flex; align-items:center; gap:10px;
      padding:16px 16px; border-top:1px solid rgba(255,255,255,.15);
      background:rgba(0,0,0,.1);
    }
    .sl-user-av {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:rgba(255,255,255,.25); color:#fff;
      font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .sl-user-info { flex:1; min-width:0; }
    .sl-user-name { display:block; font-size:12.5px; font-weight:700; color:#fff;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sl-user-role { display:block; font-size:10.5px; color:rgba(255,255,255,.65); }
    .sl-logout {
      width:30px; height:30px; border-radius:8px; border:none; flex-shrink:0;
      background:rgba(255,255,255,.15); color:#fff; cursor:pointer; font-size:13px;
      display:flex; align-items:center; justify-content:center; transition:all .2s;
    }
    .sl-logout:hover { background:rgba(255,255,255,.3); }

    /* ── MAIN ───────────────────────────────────────── */
    .sl-main-wrap { flex:1; display:flex; flex-direction:column; min-width:0; }

    .sl-topbar {
      position:sticky; top:0; z-index:100; height:60px;
      background:var(--surface,#fff);
      border-bottom:2px solid #fed7aa;
      display:flex; align-items:center; gap:12px; padding:0 24px;
      box-shadow:0 2px 12px rgba(234,88,12,.08);
    }
    .sl-burger { display:none; background:none; border:none; cursor:pointer;
      font-size:18px; color:#c2410c; }
    .sl-topbar-title { font-size:16px; font-weight:800; color:#c2410c; flex:1; }
    .sl-topbar-right { display:flex; align-items:center; gap:8px; }
    .sl-tb-btn {
      width:36px; height:36px; border-radius:9px; border:1.5px solid #fed7aa;
      background:var(--surface,#fff); color:#c2410c; cursor:pointer; font-size:14px;
      display:flex; align-items:center; justify-content:center; transition:all .2s;
      text-decoration:none; position:relative;
    }
    .sl-tb-btn:hover { background:#fff7ed; }
    .sl-tb-notif .sl-notif-dot {
      position:absolute; top:-5px; right:-5px; margin:0;
      width:16px; height:16px; border:2px solid #fff;
    }

    .sl-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:290; display:none; }

    .sl-content { flex:1; padding:24px 28px; overflow-y:auto; }

    @media(max-width:900px) {
      .sl-sidebar:not(.sl-sidebar-mobile) { display:none; }
      .sl-sidebar-mobile { display:flex; }
      .sl-burger { display:flex; }
      .sl-overlay { display:block; }
      .sl-content { padding:16px; }
    }
  `]
})
export class SecretaireLayoutComponent implements OnInit {
  dark         = false;
  sidebarOpen  = false;
  notifCount   = 0;
  rdvCount     = 0;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    this.dark = saved === 'dark';
    document.documentElement.classList.toggle('dark', this.dark);
    this.loadCounts();
    setInterval(() => this.loadCounts(), 15000);
  }

  private loadCounts(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.countNotificationsNonLues(uid).subscribe({ next: (r: any) => this.notifCount = r?.count ?? 0, error: () => {} });
    this.api.rdvs().subscribe({ next: (r: any[]) => this.rdvCount = r.filter((x: any) => x.statut === 'PLANIFIE').length, error: () => {} });
  }

  toggleDark(): void {
    this.dark = !this.dark;
    document.documentElement.classList.toggle('dark', this.dark);
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
  }

  pageTitle(): string {
    const url = window.location.pathname;
    const map: Record<string, string> = {
      '/secretaire/dashboard': 'Tableau de bord',
      '/secretaire/rendez-vous': 'Gestion des rendez-vous',
      '/secretaire/plannings': 'Planning',
      '/secretaire/patients': 'Patients',
      '/secretaire/consultations': 'Consultations',
      '/secretaire/factures': 'Facturation',
      '/secretaire/notifications': 'Notifications',
      '/secretaire/profil': 'Mon profil'
    };
    return map[url] ?? 'Secrétariat médical';
  }
}
