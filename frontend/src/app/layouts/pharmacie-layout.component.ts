import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PharmacieService } from '../core/pharmacie.service';
import { ChatbotComponent } from '../shared/chatbot.component';

@Component({
  selector: 'app-pharmacie-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgFor, ChatbotComponent],
  template: `
    <div class="pl-root">
      <header class="pl-nav">
        <div class="pl-nav-inner">
          <a class="pl-brand" routerLink="/pharmacie">
            <span class="brand-chip pl-chip"><img class="brand-logo" src="assets/logo.png" alt="MediCare"></span>
            <span class="brand-caption pl-brand-sub">Espace Pharmacie</span>
          </a>

          <nav class="pl-tabs">
            <a *ngFor="let t of onglets" [routerLink]="t.lien" routerLinkActive="pl-active" class="pl-tab">
              <i [class]="t.icone"></i><span>{{ t.libelle }}</span>
              <span class="pl-dot" *ngIf="t.lien === '/pharmacie/tableau-de-bord' && alertes > 0">{{ alertes > 9 ? '9+' : alertes }}</span>
              <span class="pl-dot" *ngIf="t.lien === '/pharmacie/notifications' && notifCount > 0">{{ notifCount > 9 ? '9+' : notifCount }}</span>
            </a>
          </nav>

          <div class="pl-right">
            <a *ngIf="isAdmin()" routerLink="/back/dashboard" class="pl-back" title="Retour à l'administration">
              <i class="fa fa-arrow-left"></i><span>Administration</span>
            </a>
            <div class="pl-user">
              <div class="pl-avatar">{{ auth.current()?.prenom?.charAt(0) }}{{ auth.current()?.nom?.charAt(0) }}</div>
              <div>
                <span class="pl-uname">{{ auth.current()?.prenom }} {{ auth.current()?.nom }}</span>
                <span class="pl-urole">{{ isAdmin() ? 'Administrateur' : 'Pharmacien' }}</span>
              </div>
            </div>
            <button class="pl-logout" (click)="auth.logout()" title="Déconnexion" aria-label="Déconnexion">
              <i class="fa fa-right-from-bracket"></i>
            </button>
          </div>

          <button class="pl-burger" (click)="menu = !menu" aria-label="Menu">
            <i [class]="menu ? 'fa fa-xmark' : 'fa fa-bars'"></i>
          </button>
        </div>

        <div class="pl-drawer" *ngIf="menu">
          <a *ngFor="let t of onglets" [routerLink]="t.lien" (click)="menu = false"><i [class]="t.icone"></i> {{ t.libelle }}</a>
          <a *ngIf="isAdmin()" routerLink="/back/dashboard" (click)="menu = false"><i class="fa fa-arrow-left"></i> Administration</a>
          <button (click)="auth.logout()"><i class="fa fa-right-from-bracket"></i> Déconnexion</button>
        </div>
      </header>

      <div class="pl-hero">
        <div class="pl-hero-icon"><i class="fa fa-prescription-bottle-medical"></i></div>
        <div>
          <div class="pl-hero-title">Pharmacie de la clinique</div>
          <div class="pl-hero-sub">Bonjour {{ auth.current()?.prenom }} — délivrance des ordonnances, suivi des lots et des stocks</div>
        </div>
      </div>

      <main class="pl-main">
        <div class="pl-content"><router-outlet></router-outlet></div>
      </main>
    </div>
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    :host { display:block; --mc-accent:#0f766e; }
    .pl-root { min-height:100vh; background:var(--bg,#f0f4f8); }
    .pl-nav { position:sticky; top:0; z-index:200; background:var(--surface,#fff); border-bottom:1.5px solid var(--border,#e2e8f0); box-shadow:0 1px 12px rgba(0,0,0,.06); }
    .pl-nav-inner { max-width:1400px; margin:0 auto; padding:0 24px; height:66px; display:flex; align-items:center; gap:8px; }
    .pl-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; margin-right:12px; }
    .pl-chip { box-shadow:none; padding:3px 6px; }
    .pl-chip .brand-logo { height:34px; }
    .pl-brand-sub { color:var(--text-muted,#94a3b8); padding-left:10px; border-left:1px solid var(--border,#e2e8f0); }
    .pl-tabs { display:flex; gap:2px; flex:1; overflow-x:auto; scrollbar-width:none; }
    .pl-tabs::-webkit-scrollbar { display:none; }
    .pl-tab { position:relative; display:flex; align-items:center; gap:7px; padding:8px 14px; border-radius:9px; font-size:13.5px; font-weight:600; color:var(--text-muted,#64748b); text-decoration:none; white-space:nowrap; transition:all .18s; flex-shrink:0; }
    .pl-tab:hover { background:var(--bg,#f0f4f8); color:var(--text,#0f172a); }
    .pl-active { background:#ccfbf1 !important; color:#0f766e !important; }
    .pl-dot { position:absolute; top:-3px; right:-3px; min-width:17px; height:17px; border-radius:999px; padding:0 4px; background:#ef4444; color:#fff; font-size:10px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; border:2px solid var(--surface,#fff); }
    .pl-right { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }
    .pl-back { display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:var(--text-muted); text-decoration:none; padding:7px 10px; border-radius:8px; border:1.5px solid var(--border); }
    .pl-back:hover { color:#0f766e; border-color:#0f766e; }
    .pl-user { display:flex; align-items:center; gap:8px; background:var(--bg,#f0f4f8); border:1.5px solid var(--border,#e2e8f0); border-radius:999px; padding:4px 14px 4px 4px; }
    .pl-avatar { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#0f766e,#0e7490); color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .pl-uname { display:block; font-size:12px; font-weight:700; color:var(--text,#0f172a); }
    .pl-urole { display:block; font-size:10px; color:var(--text-muted,#94a3b8); }
    .pl-logout { width:34px; height:34px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0); background:var(--surface,#fff); color:var(--text-muted,#94a3b8); cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .pl-logout:hover { background:#fff5f5; color:#ef4444; border-color:#fca5a5; }
    .pl-burger { display:none; background:none; border:none; cursor:pointer; font-size:20px; color:var(--text,#0f172a); margin-left:auto; }
    .pl-drawer { padding:10px 20px 14px; display:flex; flex-direction:column; gap:2px; border-top:1px solid var(--border,#e2e8f0); background:var(--surface,#fff); }
    .pl-drawer a, .pl-drawer button { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:9px; font-size:13.5px; font-weight:600; color:var(--text-muted,#64748b); background:none; border:none; cursor:pointer; text-decoration:none; }
    .pl-drawer a:hover, .pl-drawer button:hover { background:var(--bg,#f0f4f8); }
    .pl-hero { display:flex; align-items:center; gap:16px; background:linear-gradient(135deg,#0f766e,#0e7490); padding:20px 32px; color:#fff; }
    .pl-hero-icon { width:48px; height:48px; border-radius:14px; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .pl-hero-title { font-size:18px; font-weight:900; margin-bottom:3px; }
    .pl-hero-sub { font-size:13px; color:rgba(255,255,255,.8); }
    .pl-main { padding:24px 32px; }
    .pl-content { max-width:1400px; margin:0 auto; }
    @media(max-width:1100px) { .pl-tabs, .pl-right { display:none; } .pl-burger { display:flex; } }
    @media(max-width:600px) { .pl-main { padding:16px; } .pl-hero { padding:16px; } }
  `]
})
export class PharmacieLayoutComponent implements OnInit, OnDestroy {
  menu = false;
  notifCount = 0;
  alertes = 0;
  private timer?: ReturnType<typeof setInterval>;

  readonly onglets = [
    { lien: '/pharmacie/tableau-de-bord', libelle: 'Tableau de bord', icone: 'fa fa-gauge-high' },
    { lien: '/pharmacie/ordonnances',     libelle: 'Ordonnances',     icone: 'fa fa-file-prescription' },
    { lien: '/pharmacie/stock',           libelle: 'Stock',           icone: 'fa fa-boxes-stacked' },
    { lien: '/pharmacie/receptions',      libelle: 'Réceptions',      icone: 'fa fa-truck-ramp-box' },
    { lien: '/pharmacie/catalogue',       libelle: 'Catalogue',       icone: 'fa fa-capsules' },
    { lien: '/pharmacie/notifications',   libelle: 'Notifications',   icone: 'fa fa-bell' },
  ];

  constructor(public auth: AuthService, private api: ApiService, private pharmacie: PharmacieService) {}

  ngOnInit(): void {
    this.rafraichir();
    this.timer = setInterval(() => this.rafraichir(), 30000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  isAdmin(): boolean { return this.auth.role() === 'ADMIN'; }

  private rafraichir(): void {
    const uid = this.auth.current()?.id;
    if (uid) {
      this.api.countNotifications(uid).subscribe({ next: (r: any) => this.notifCount = r?.count ?? 0, error: () => {} });
    }
    this.pharmacie.alertes().subscribe({
      next: a => this.alertes = a.filter(x => x.niveau === 'CRITIQUE').length,
      error: () => {}
    });
  }
}
