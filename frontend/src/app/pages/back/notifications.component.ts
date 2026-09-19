import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RouterLink, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  template: `
    <div class="notif-page">

      <!-- HEADER -->
      <div class="notif-header">
        <div>
          <h2 class="notif-title"><i class="fa fa-bell"></i> Notifications</h2>
          <p class="notif-sub">{{ nonLues }} non lue{{ nonLues > 1 ? 's' : '' }}</p>
        </div>
        <div class="notif-header-actions">
          <button class="notif-btn notif-btn-test" (click)="creerNotifTest()" title="Créer une notification de test">
            <i class="fa fa-plus"></i> Test
          </button>
          <button class="notif-btn" (click)="toutLire()" *ngIf="nonLues > 0">
            <i class="fa fa-check-double"></i> Tout marquer comme lu
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="notif-tabs">
        <button [class.active]="tab==='toutes'" (click)="tab='toutes'">
          Toutes <span class="ntc">{{ notifications.length }}</span>
        </button>
        <button [class.active]="tab==='nonlues'" (click)="tab='nonlues'">
          Non lues <span class="ntc ntc-blue">{{ nonLues }}</span>
        </button>
      </div>

      <!-- LOADING -->
      <div class="notif-loading" *ngIf="loading">
        <div class="notif-sk" *ngFor="let x of [1,2,3,4]"></div>
      </div>

      <!-- EMPTY -->
      <div class="notif-empty" *ngIf="!loading && filtered().length === 0">
        <div class="notif-empty-icon"><i class="fa fa-bell-slash"></i></div>
        <h3>Aucune notification</h3>
        <p>Vous êtes à jour !</p>
      </div>

      <!-- LIST -->
      <div class="notif-list" *ngIf="!loading">
        <div class="notif-item"
             *ngFor="let n of filtered()"
             [class.unread]="!n.lue"
             (click)="marquerLue(n)">
          <div class="notif-icon-wrap" [class]="typeClass(n.type)">
            <i [class]="'fa '+typeIcon(n.type)"></i>
          </div>
          <div class="notif-body">
            <div class="notif-item-title">{{ n.titre }}</div>
            <div class="notif-item-msg">{{ n.message }}</div>
            <div class="notif-item-date">{{ n.dateCreation | date:'dd/MM/yyyy à HH:mm' }}</div>
          </div>
          <div class="notif-right">
            <div class="notif-dot" *ngIf="!n.lue"></div>
            <span class="notif-type-badge" [class]="typeClass(n.type)">{{ typeLabel(n.type) }}</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .notif-page { max-width:800px; margin:0 auto; display:flex; flex-direction:column; gap:20px; }

    .notif-header { display:flex; align-items:center; justify-content:space-between; }
    .notif-title  { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 4px; }
    .notif-title i{ color:#f59e0b; margin-right:8px; }
    .notif-sub    { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .notif-header-actions { display:flex; align-items:center; gap:8px; }
    .notif-btn {
      display:flex; align-items:center; gap:7px;
      padding:9px 18px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .notif-btn:hover { background:#f0f9ff; border-color:#bfdbfe; color:#0f6cbd; }
    .notif-btn-test {
      border-color:#d1fae5; color:#15803d; background:#f0fdf4;
    }
    .notif-btn-test:hover { background:#15803d; color:#fff; border-color:#15803d; }

    /* Tabs */
    .notif-tabs {
      display:flex; gap:6px; background:var(--bg,#f1f5f9); border-radius:12px; padding:5px;
    }
    .notif-tabs button {
      flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
      padding:10px 16px; border-radius:9px; border:none; cursor:pointer;
      font-size:14px; font-weight:700; color:var(--text-muted,#64748b);
      background:transparent; transition:all .2s;
    }
    .notif-tabs button.active {
      background:var(--surface,#fff); color:var(--text,#0f172a);
      box-shadow:0 2px 8px rgba(0,0,0,.08);
    }
    .ntc {
      min-width:20px; height:20px; border-radius:999px;
      background:var(--border,#e2e8f0); color:var(--text-muted,#64748b);
      font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; padding:0 6px;
    }
    .ntc-blue { background:#0f6cbd; color:#fff; }

    /* Empty */
    .notif-empty { text-align:center; padding:52px 24px; }
    .notif-empty-icon {
      width:72px; height:72px; border-radius:50%; margin:0 auto 16px;
      background:var(--bg,#f1f5f9); display:flex; align-items:center; justify-content:center;
      font-size:28px; color:#94a3b8;
    }
    .notif-empty h3 { font-size:18px; font-weight:800; color:var(--text,#0f172a); margin:0 0 8px; }
    .notif-empty p  { font-size:14px; color:var(--text-muted,#64748b); margin:0; }

    /* List */
    .notif-list { display:flex; flex-direction:column; gap:8px; }
    .notif-item {
      display:flex; align-items:center; gap:14px;
      background:var(--surface,#fff); border-radius:14px; padding:16px 18px;
      border:1.5px solid var(--border,#f1f5f9); cursor:pointer; transition:all .18s;
    }
    .notif-item:hover { background:var(--bg,#f8fafc); border-color:var(--border,#e2e8f0); }
    .notif-item.unread {
      background:#fefce8; border-color:#fde68a;
      box-shadow:0 2px 8px rgba(245,158,11,.1);
    }
    .notif-item.unread:hover { background:#fef9c3; }

    .notif-icon-wrap {
      width:42px; height:42px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:17px;
    }
    .type-rdv    { background:#dbeafe; color:#1d4ed8; }
    .type-examen { background:#f3e8ff; color:#7e22ce; }
    .type-facture{ background:#dcfce7; color:#15803d; }
    .type-prescription{ background:#fff7ed; color:#c2410c; }
    .type-info   { background:#f1f5f9; color:#475569; }

    .notif-body { flex:1; min-width:0; }
    .notif-item-title { font-size:14px; font-weight:700; color:var(--text,#0f172a); margin-bottom:3px; }
    .notif-item-msg   { font-size:13px; color:var(--text-muted,#64748b); line-height:1.5; margin-bottom:5px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .notif-item-date  { font-size:11.5px; color:var(--text-muted,#94a3b8); }

    .notif-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
    .notif-dot { width:10px; height:10px; border-radius:50%; background:#f59e0b; }
    .notif-type-badge {
      padding:3px 9px; border-radius:999px; font-size:10.5px; font-weight:700;
    }

    /* Loading skeleton */
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .notif-loading { display:flex; flex-direction:column; gap:10px; }
    .notif-sk {
      height:72px; border-radius:14px;
      background:linear-gradient(90deg,var(--bg,#f1f5f9) 25%,var(--border,#e2e8f0) 50%,var(--bg,#f1f5f9) 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  nonLues = 0;
  loading = true;
  tab: 'toutes' | 'nonlues' = 'toutes';

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    // Recharger à chaque fois qu'on navigue vers cette page
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.load());
  }

  load(): void {
    const uid = this.auth.current()?.id;
    if (!uid) { this.loading = false; return; }
    this.loading = true;
    this.api.notifications(uid).subscribe({
      next: n => {
        this.notifications = n;
        this.nonLues = n.filter((x: any) => !x.lue).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  marquerLue(n: any): void {
    if (n.lue) return;
    this.api.marquerNotifLue(n.id).subscribe(() => { n.lue = true; this.nonLues = Math.max(0, this.nonLues - 1); });
  }

  toutLire(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.marquerNotifsLues(uid).subscribe(() => {
      this.notifications.forEach(n => n.lue = true);
      this.nonLues = 0;
    });
  }

  creerNotifTest(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.createNotifTest(uid).subscribe(() => this.load());
  }

  filtered(): any[] {
    return this.tab === 'nonlues' ? this.notifications.filter(n => !n.lue) : this.notifications;
  }

  typeClass(t: string): string {
    if (!t) return 'type-info';
    if (t.includes('RDV') || t.includes('RAPPEL')) return 'type-rdv';
    if (t.includes('EXAMEN') || t.includes('RESULTAT')) return 'type-examen';
    if (t.includes('FACTURE')) return 'type-facture';
    if (t.includes('PRESCRIPTION')) return 'type-prescription';
    return 'type-info';
  }
  typeIcon(t: string): string {
    if (t?.includes('RDV') || t?.includes('RAPPEL')) return 'fa-calendar-check';
    if (t?.includes('EXAMEN') || t?.includes('RESULTAT')) return 'fa-flask';
    if (t?.includes('FACTURE')) return 'fa-file-invoice-dollar';
    if (t?.includes('PRESCRIPTION')) return 'fa-prescription';
    return 'fa-bell';
  }
  typeLabel(t: string): string {
    const m: Record<string,string> = {
      RAPPEL_RDV:'RDV', RESULTAT_EXAMEN:'Examen', FACTURE_GENEREE:'Facture',
      NOUVELLE_PRESCRIPTION:'Prescription', RDV_CONFIRME:'RDV', RDV_ANNULE:'RDV',
      RESULTAT_DISPONIBLE:'Résultat', INFORMATION:'Info'
    };
    return m[t] ?? 'Notification';
  }
}
