import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ChatbotComponent } from '../shared/chatbot.component';

@Component({
  selector: 'app-labo-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, ChatbotComponent],
  template: `
    <div class="ll-root">

      <!-- ══ TOPNAV ══ -->
      <header class="ll-nav">
        <div class="ll-nav-inner">

          <a class="ll-brand" routerLink="/labo">
            <span class="brand-chip ll-chip"><img class="brand-logo" src="assets/logo.png" alt="Medicare"></span>
            <span class="brand-caption ll-brand-sub">Espace Laboratoire</span>
          </a>

          <nav class="ll-tabs">
            <a routerLink="/labo/examens"  routerLinkActive="ll-active" class="ll-tab">
              <i class="fa fa-microscope"></i><span>Analyses en attente</span>
            </a>
            <a routerLink="/labo/resultats" routerLinkActive="ll-active" class="ll-tab">
              <i class="fa fa-circle-check"></i><span>Résultats publiés</span>
            </a>
            <a routerLink="/labo/notifications" routerLinkActive="ll-active" class="ll-tab ll-notif-tab">
              <i class="fa fa-bell"></i><span>Notifications</span>
              <span class="ll-notif-dot" *ngIf="notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
            </a>
          </nav>

          <div class="ll-right">
            <div class="ll-user-chip">
              <div class="ll-avatar">
                {{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}
              </div>
              <div class="ll-user-info">
                <span class="ll-uname">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
                <span class="ll-urole">Technicien de laboratoire</span>
              </div>
            </div>
            <button class="ll-logout" (click)="auth.logout()" title="Déconnexion">
              <i class="fa fa-right-from-bracket"></i>
            </button>
          </div>

          <button class="ll-burger" (click)="m=!m">
            <i [class]="m ? 'fa fa-xmark' : 'fa fa-bars'"></i>
          </button>
        </div>

        <div class="ll-drawer" *ngIf="m">
          <a routerLink="/labo/examens"      (click)="m=false"><i class="fa fa-microscope"></i> Analyses en attente</a>
          <a routerLink="/labo/resultats"    (click)="m=false"><i class="fa fa-circle-check"></i> Résultats publiés</a>
          <a routerLink="/labo/notifications"(click)="m=false"><i class="fa fa-bell"></i> Notifications</a>
          <button (click)="auth.logout()"><i class="fa fa-right-from-bracket"></i> Déconnexion</button>
        </div>
      </header>

      <!-- ══ HERO ══ -->
      <div class="ll-hero">
        <div class="ll-hero-icon"><i class="fa fa-flask"></i></div>
        <div>
          <div class="ll-hero-title">Espace Laboratoire</div>
          <div class="ll-hero-sub">Bonjour {{ auth.current()?.prenom }} — Saisissez et publiez les résultats d'analyses</div>
        </div>
      </div>

      <!-- ══ CONTENT ══ -->
      <main class="ll-main">
        <div class="ll-content">
          <router-outlet></router-outlet>
        </div>
      </main>

    </div>
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    :host { display:block; }
    .ll-root { min-height:100vh; background:var(--bg,#f0f4f8); font-family:'Inter','Plus Jakarta Sans',sans-serif; }

    /* ── Nav ───────────────────────────────────── */
    .ll-nav {
      position:sticky; top:0; z-index:200;
      background:var(--surface,#fff);
      border-bottom:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 1px 12px rgba(0,0,0,.06);
    }
    .ll-nav-inner {
      max-width:1400px; margin:0 auto; padding:0 24px;
      height:66px; display:flex; align-items:center; gap:8px;
    }

    .ll-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; margin-right:16px; }
    /* pastille discrète : lisible en thème clair comme sombre */
    .ll-chip { box-shadow:none; padding:3px 6px; }
    .ll-chip .brand-logo { height:34px; }
    .ll-brand-sub  { color:var(--text-muted,#94a3b8); padding-left:10px; border-left:1px solid var(--border,#e2e8f0); }

    .ll-tabs { display:flex; gap:2px; flex:1; overflow-x:auto; scrollbar-width:none; }
    .ll-tabs::-webkit-scrollbar { display:none; }
    .ll-tab {
      display:flex; align-items:center; gap:7px;
      padding:8px 16px; border-radius:9px; font-size:13.5px; font-weight:600;
      color:var(--text-muted,#64748b); text-decoration:none;
      white-space:nowrap; transition:all .18s; flex-shrink:0; position:relative;
    }
    .ll-tab:hover { background:var(--bg,#f0f4f8); color:var(--text,#0f172a); }
    .ll-active { background:#f3e8ff !important; color:#7e22ce !important; }
    .ll-notif-tab { position:relative; }
    .ll-notif-dot {
      position:absolute; top:-3px; right:-3px;
      min-width:17px; height:17px; border-radius:999px; padding:0 4px;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center;
      border:2px solid var(--surface,#fff);
    }

    .ll-right { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }
    .ll-user-chip {
      display:flex; align-items:center; gap:8px;
      background:var(--bg,#f0f4f8); border:1.5px solid var(--border,#e2e8f0);
      border-radius:999px; padding:4px 14px 4px 4px;
    }
    .ll-avatar {
      width:30px; height:30px; border-radius:50%;
      background:linear-gradient(135deg,#7e22ce,#4338ca);
      color:#fff; font-size:11px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .ll-uname { display:block; font-size:12px; font-weight:700; color:var(--text,#0f172a); }
    .ll-urole { display:block; font-size:10px; color:var(--text-muted,#94a3b8); }
    .ll-logout {
      width:34px; height:34px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#94a3b8);
      cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center;
      transition:all .2s;
    }
    .ll-logout:hover { background:#fff5f5; color:#ef4444; border-color:#fca5a5; }
    .ll-burger { display:none; background:none; border:none; cursor:pointer; font-size:20px; color:var(--text,#0f172a); margin-left:auto; }
    .ll-drawer {
      padding:10px 20px 14px; display:flex; flex-direction:column; gap:2px;
      border-top:1px solid var(--border,#e2e8f0); background:var(--surface,#fff);
    }
    .ll-drawer a, .ll-drawer button {
      display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px;
      font-size:13.5px; font-weight:600; color:var(--text-muted,#64748b);
      background:none; border:none; cursor:pointer; text-decoration:none; transition:background .15s;
    }
    .ll-drawer a:hover, .ll-drawer button:hover { background:var(--bg,#f0f4f8); }

    /* ── Hero ──────────────────────────────────── */
    .ll-hero {
      display:flex; align-items:center; gap:16px;
      background:linear-gradient(135deg,#7e22ce,#4338ca);
      padding:20px 32px; color:#fff;
    }
    .ll-hero-icon {
      width:48px; height:48px; border-radius:14px; background:rgba(255,255,255,.2);
      display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;
    }
    .ll-hero-title { font-size:18px; font-weight:900; margin-bottom:3px; }
    .ll-hero-sub   { font-size:13px; color:rgba(255,255,255,.75); }

    /* ── Main ──────────────────────────────────── */
    .ll-main    { padding:24px 32px; }
    .ll-content { max-width:1400px; margin:0 auto; }

    @media(max-width:900px) {
      .ll-tabs, .ll-right { display:none; }
      .ll-burger { display:flex; }
    }
  `]
})
export class LaboLayoutComponent implements OnInit {
  m = false;
  notifCount = 0;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadCount();
    setInterval(() => this.loadCount(), 30000);
  }

  private loadCount(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.countNotificationsNonLues(uid).subscribe({
      next: (r: any) => this.notifCount = r?.count ?? 0,
      error: () => {}
    });
  }
}
