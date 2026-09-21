import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ChatbotComponent } from '../shared/chatbot.component';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatbotComponent, NgIf, NgFor],
  template: `
    <div class="pt-root">

      <!-- ══ POPUP NOTIFICATION TEMPS RÉEL ══ -->
      <div class="pt-notif-popup" [class.show]="popup.show">
        <div class="pt-popup-icon" [class]="popup.type">
          <i [class]="popup.icon"></i>
        </div>
        <div class="pt-popup-body">
          <div class="pt-popup-title">{{ popup.title }}</div>
          <div class="pt-popup-msg">{{ popup.msg }}</div>
        </div>
        <button class="pt-popup-close" (click)="popup.show=false">
          <i class="fa fa-xmark"></i>
        </button>
      </div>

      <!-- ══ TOPNAV ══ -->
      <header class="pt-nav">
        <div class="pt-nav-inner">
          <a class="pt-brand" routerLink="/">
            <img class="brand-logo" src="assets/logo.png" alt="Medicare">
            <span class="brand-caption pt-brand-sub">Espace Patient</span>
          </a>

          <nav class="pt-tabs">
            <a routerLink="/front/rdv"        routerLinkActive="pt-active" class="pt-tab">
              <i class="fa fa-calendar-plus"></i><span>Rendez-vous</span>
            </a>
            <a routerLink="/front/dossier"    routerLinkActive="pt-active" class="pt-tab">
              <i class="fa fa-folder-open"></i><span>Mon dossier</span>
            </a>
            <a routerLink="/front/historique" routerLinkActive="pt-active" class="pt-tab">
              <i class="fa fa-clock-rotate-left"></i><span>Historique</span>
            </a>
            <a routerLink="/front/examens"    routerLinkActive="pt-active" class="pt-tab">
              <i class="fa fa-flask"></i><span>Mes examens</span>
            </a>
            <a routerLink="/front/factures"   routerLinkActive="pt-active" class="pt-tab">
              <i class="fa fa-file-invoice"></i><span>Mes factures</span>
            </a>
          </nav>

          <div class="pt-right">
            <!-- Cloche avec badge -->
            <a routerLink="/front/notifications" class="pt-bell" title="Notifications">
              <i class="fa fa-bell"></i>
              <span class="pt-bell-badge" *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
            </a>
            <a routerLink="/front/dossier" class="pt-user-chip">
              <div class="pt-avatar">{{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}</div>
              <div class="pt-user-info">
                <span class="pt-uname">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
                <span class="pt-urole">Patient</span>
              </div>
            </a>
            <button class="pt-logout" (click)="auth.logout()" title="Déconnexion">
              <i class="fa fa-right-from-bracket"></i>
            </button>
          </div>

          <button class="pt-burger" (click)="m=!m"><i [class]="m?'fa fa-xmark':'fa fa-bars'"></i></button>
        </div>

        <div class="pt-drawer" *ngIf="m">
          <a routerLink="/front/rdv"           (click)="m=false"><i class="fa fa-calendar-plus"></i> Rendez-vous</a>
          <a routerLink="/front/dossier"       (click)="m=false"><i class="fa fa-folder-open"></i> Mon dossier</a>
          <a routerLink="/front/historique"    (click)="m=false"><i class="fa fa-clock-rotate-left"></i> Historique</a>
          <a routerLink="/front/examens"       (click)="m=false"><i class="fa fa-flask"></i> Mes examens</a>
          <a routerLink="/front/factures"      (click)="m=false"><i class="fa fa-file-invoice"></i> Mes factures</a>
          <a routerLink="/front/notifications" (click)="m=false">
            <i class="fa fa-bell"></i> Notifications
            <span class="pt-drawer-badge" *ngIf="notifCount > 0">{{ notifCount }}</span>
          </a>
          <button (click)="auth.logout()"><i class="fa fa-right-from-bracket"></i> Déconnexion</button>
        </div>
      </header>

      <!-- ══ HERO PATIENT ══ -->
      <div class="pt-hero">
        <div class="pt-hero-bg">
          <div class="pt-blob pt-b1"></div>
          <div class="pt-blob pt-b2"></div>
        </div>
        <div class="pt-hero-inner">
          <div class="pt-hero-left">
            <div class="pt-hero-greeting">{{ greeting() }}, <strong>{{ auth.current()?.prenom }}</strong> 👋</div>
            <div class="pt-hero-sub">Gérez votre santé en toute simplicité</div>
          </div>
          <div class="pt-hero-pills">
            <div class="pt-hpill"><i class="fa fa-shield-halved"></i> Données sécurisées</div>
            <div class="pt-hpill"><i class="fa fa-calendar-check"></i> RDV en ligne</div>
          </div>
        </div>
      </div>

      <!-- ══ CONTENT ══ -->
      <main class="pt-main">
        <div class="pt-content">
          <router-outlet></router-outlet>
        </div>
      </main>

    </div>
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    :host { display:block; }
    .pt-root { min-height:100vh; background:#f0f9ff; font-family:'Inter','Plus Jakarta Sans',sans-serif; }

    /* ══ POPUP NOTIFICATION ════════════════════════ */
    .pt-notif-popup {
      position:fixed; top:80px; right:24px; z-index:9999;
      display:flex; align-items:flex-start; gap:12px;
      padding:14px 16px; border-radius:16px; min-width:320px; max-width:400px;
      background:#fff; border:1.5px solid #bae6fd;
      box-shadow:0 12px 40px rgba(14,165,233,.2);
      opacity:0; transform:translateX(50px) scale(.95); pointer-events:none;
      transition:all .35s cubic-bezier(.4,0,.2,1);
    }
    .pt-notif-popup.show { opacity:1; transform:translateX(0) scale(1); pointer-events:all; }
    .pt-popup-icon {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:18px;
    }
    .pt-popup-icon.success { background:#dcfce7; color:#15803d; }
    .pt-popup-icon.error   { background:#fee2e2; color:#b91c1c; }
    .pt-popup-icon.info    { background:#dbeafe; color:#1d4ed8; }
    .pt-popup-body { flex:1; }
    .pt-popup-title { font-size:14px; font-weight:800; color:#0f172a; margin-bottom:3px; }
    .pt-popup-msg   { font-size:12.5px; color:#64748b; line-height:1.5; }
    .pt-popup-close {
      background:none; border:none; cursor:pointer; color:#94a3b8;
      font-size:14px; padding:2px; border-radius:6px; flex-shrink:0;
    }
    .pt-popup-close:hover { color:#0ea5e9; }

    /* ── NAV ──────────────────────────────────────── */
    .pt-nav {
      position:sticky; top:0; z-index:100; background:#fff;
      border-bottom:2px solid #bae6fd;
      box-shadow:0 1px 12px rgba(14,165,233,.1);
    }
    .pt-nav-inner {
      max-width:1200px; margin:0 auto; padding:0 24px;
      height:64px; display:flex; align-items:center; gap:8px;
    }

    .pt-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; margin-right:16px; }
    .pt-brand-sub  { color:#d3121c; padding-left:10px; border-left:1px solid #e2e8f0; }

    .pt-tabs { display:flex; gap:2px; flex:1; overflow-x:auto; scrollbar-width:none; }
    .pt-tabs::-webkit-scrollbar { display:none; }
    .pt-tab {
      display:flex; align-items:center; gap:7px;
      padding:8px 14px; border-radius:9px; font-size:13.5px; font-weight:600;
      color:#64748b; text-decoration:none; white-space:nowrap; transition:all .18s;
    }
    .pt-tab:hover { background:#e0f2fe; color:#0ea5e9; }
    .pt-active { background:#bae6fd !important; color:#0369a1 !important; }

    .pt-right { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }

    /* Cloche avec badge */
    .pt-bell {
      position:relative; width:38px; height:38px; border-radius:10px;
      border:1.5px solid #bae6fd; background:#f0f9ff; color:#0ea5e9;
      display:flex; align-items:center; justify-content:center;
      text-decoration:none; font-size:15px; transition:all .2s;
    }
    .pt-bell:hover { background:#0ea5e9; color:#fff; border-color:#0ea5e9; }
    .pt-bell-badge {
      position:absolute; top:-5px; right:-5px;
      min-width:18px; height:18px; border-radius:999px; padding:0 4px;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      border:2px solid #fff; animation:bellPulse 2s ease infinite;
    }
    @keyframes bellPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

    .pt-user-chip {
      display:flex; align-items:center; gap:8px; text-decoration:none;
      background:#f0f9ff; border:1.5px solid #bae6fd; border-radius:999px;
      padding:4px 14px 4px 4px; transition:all .18s;
    }
    .pt-user-chip:hover { background:#e0f2fe; }
    .pt-avatar {
      width:30px; height:30px; border-radius:50%;
      background:linear-gradient(135deg,#0ea5e9,#06b6d4);
      color:#fff; font-size:11px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .pt-uname { display:block; font-size:12px; font-weight:700; color:#0c4a6e; }
    .pt-urole { display:block; font-size:10px; color:#7dd3fc; font-weight:600; }
    .pt-logout {
      width:36px; height:36px; border-radius:9px; border:1.5px solid #bae6fd;
      background:#fff; color:#7dd3fc; cursor:pointer; font-size:13px;
      display:flex; align-items:center; justify-content:center; transition:all .2s;
    }
    .pt-logout:hover { background:#fff5f5; color:#ef4444; border-color:#fca5a5; }
    .pt-burger { display:none; background:transparent; border:none; cursor:pointer; font-size:20px; color:#0c4a6e; margin-left:auto; }
    .pt-drawer {
      padding:10px 20px 14px; display:flex; flex-direction:column; gap:2px;
      background:#fff; border-top:2px solid #bae6fd;
    }
    .pt-drawer a, .pt-drawer button {
      display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px;
      font-size:13.5px; font-weight:600; color:#475569; background:none; border:none;
      cursor:pointer; text-decoration:none; transition:background .15s;
    }
    .pt-drawer a:hover, .pt-drawer button:hover { background:#e0f2fe; color:#0ea5e9; }
    .pt-drawer-badge {
      margin-left:auto; min-width:18px; height:18px; border-radius:999px; padding:0 5px;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center;
    }

    /* ── HERO ─────────────────────────────────────── */
    .pt-hero {
      position:relative; overflow:hidden;
      background:linear-gradient(135deg,#0ea5e9 0%,#06b6d4 50%,#0891b2 100%);
      padding:36px 24px 44px;
    }
    .pt-hero-bg { position:absolute; inset:0; pointer-events:none; }
    .pt-blob { position:absolute; border-radius:50%; filter:blur(50px); opacity:.2; }
    .pt-b1 { width:350px; height:350px; background:#fff; top:-120px; right:-60px; }
    .pt-b2 { width:250px; height:250px; background:#67e8f9; bottom:-80px; left:5%; }

    .pt-hero-inner {
      position:relative; z-index:1; max-width:1200px; margin:0 auto;
      display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;
    }
    .pt-hero-greeting { font-size:26px; font-weight:700; color:#fff; margin-bottom:6px; }
    .pt-hero-greeting strong { font-weight:900; }
    .pt-hero-sub { font-size:14px; color:rgba(255,255,255,.8); }
    .pt-hero-pills { display:flex; gap:10px; flex-wrap:wrap; }
    .pt-hpill {
      display:flex; align-items:center; gap:7px; padding:8px 16px; border-radius:999px;
      font-size:12.5px; font-weight:700; background:rgba(255,255,255,.2); color:#fff;
      border:1.5px solid rgba(255,255,255,.3); backdrop-filter:blur(8px);
    }

    /* ── MAIN ─────────────────────────────────────── */
    .pt-main { padding:28px 24px 48px; margin-top:-16px; position:relative; z-index:1; }
    .pt-content { max-width:1200px; margin:0 auto; }

    @media(max-width:768px) {
      .pt-tabs, .pt-right { display:none; }
      .pt-burger { display:block; margin-left:auto; }
    }
  `]
})
export class FrontLayoutComponent implements OnInit, OnDestroy {
  m = false;
  notifCount = 0;
  popup = { show: false, type: 'info', icon: 'fa fa-bell', title: '', msg: '' };
  private lastCount = 0;
  private interval: any;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadNotif();
    this.interval = setInterval(() => this.loadNotif(), 15000);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  private loadNotif(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.countNotificationsNonLues(uid).subscribe({
      next: (r: any) => {
        const count = r?.count ?? 0;
        // Nouvelle notification reçue depuis la dernière vérification
        if (count > this.lastCount && this.lastCount !== 0) {
          this.fetchLatestNotif(uid);
        }
        this.lastCount = count;
        this.notifCount = count;
      },
      error: () => {}
    });
  }

  private fetchLatestNotif(uid: number): void {
    this.api.notificationsNonLues(uid).subscribe({
      next: (notifs: any[]) => {
        if (notifs.length > 0) {
          const n = notifs[0];
          const isRdvConfirme = n.type === 'RDV_CONFIRME';
          const isRdvAnnule   = n.type === 'RDV_ANNULE';
          this.showPopup(
            isRdvConfirme ? 'success' : isRdvAnnule ? 'error' : 'info',
            isRdvConfirme ? 'fa fa-circle-check' : isRdvAnnule ? 'fa fa-circle-xmark' : 'fa fa-bell',
            n.titre, n.message
          );
        }
      },
      error: () => {}
    });
  }

  showPopup(type: string, icon: string, title: string, msg: string): void {
    this.popup = { show: true, type, icon, title, msg };
    setTimeout(() => this.popup = { ...this.popup, show: false }, 6000);
  }

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }
}
