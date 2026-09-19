import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  template: `
    <div class="nl-wrap">

      <!-- Header -->
      <div class="nl-head">
        <div class="nl-head-left">
          <i class="fa fa-bell"></i>
          <span>Notifications</span>
          <span class="nl-badge" *ngIf="nonLues > 0">{{ nonLues }}</span>
        </div>
        <button class="nl-mark-all" *ngIf="nonLues > 0" (click)="toutLire()">
          <i class="fa fa-check-double"></i> Tout lire
        </button>
      </div>

      <!-- Loading -->
      <div class="nl-loading" *ngIf="loading">
        <div class="nl-sk" *ngFor="let x of [1,2,3]"></div>
      </div>

      <!-- Vide -->
      <div class="nl-empty" *ngIf="!loading && items.length === 0">
        <i class="fa fa-bell-slash"></i>
        <p>Aucune notification</p>
      </div>

      <!-- Liste -->
      <div class="nl-list" *ngIf="!loading && items.length > 0">
        <div class="nl-item" [class.unread]="!n.lue"
             *ngFor="let n of items"
             (click)="marquerLue(n)">
          <div class="nl-icon" [style.background]="iconBg(n.type)" [style.color]="iconColor(n.type)">
            <i [class]="'fa ' + typeIcon(n.type)"></i>
          </div>
          <div class="nl-body">
            <div class="nl-titre">{{ n.titre }}</div>
            <div class="nl-msg">{{ n.message }}</div>
            <div class="nl-time">{{ n.dateCreation | date:'dd/MM/yyyy à HH:mm' }}</div>
          </div>
          <div class="nl-dot" *ngIf="!n.lue"></div>
        </div>
      </div>

      <!-- Voir toutes (lien vers page dédiée si back-office) -->
      <div class="nl-footer" *ngIf="items.length > 0 && showLink">
        <a [routerLink]="linkUrl" class="nl-link">
          Voir toutes les notifications <i class="fa fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .nl-wrap { display:flex; flex-direction:column; gap:0; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .nl-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 20px; border-bottom:1.5px solid var(--border,#f1f5f9);
    }
    .nl-head-left { display:flex; align-items:center; gap:8px;
      font-size:14px; font-weight:800; color:var(--text,#0f172a); }
    .nl-head-left i { color:#f59e0b; }
    .nl-badge {
      min-width:20px; height:20px; border-radius:999px; padding:0 5px;
      background:#ef4444; color:#fff; font-size:11px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center;
    }
    .nl-mark-all {
      display:flex; align-items:center; gap:5px;
      background:none; border:1.5px solid var(--border,#e2e8f0); border-radius:8px;
      padding:5px 12px; font-size:12px; font-weight:700; color:var(--text-muted,#64748b);
      cursor:pointer; transition:all .15s;
    }
    .nl-mark-all:hover { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }

    .nl-loading { display:flex; flex-direction:column; gap:8px; padding:16px 20px; }
    .nl-sk { height:64px; border-radius:12px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; }

    .nl-empty { text-align:center; padding:40px 20px; color:var(--text-muted,#94a3b8); }
    .nl-empty i { font-size:32px; display:block; margin-bottom:10px; color:#fde68a; }
    .nl-empty p { font-size:13px; margin:0; }

    .nl-list { display:flex; flex-direction:column; }
    .nl-item {
      display:flex; align-items:flex-start; gap:12px;
      padding:14px 20px; cursor:pointer; transition:background .15s;
      border-bottom:1px solid var(--border,#f8fafc); position:relative;
    }
    .nl-item:hover { background:var(--bg,#f8fafc); }
    .nl-item.unread { background:linear-gradient(135deg,#fffbeb,#fff); }
    .nl-item.unread:hover { background:#fef9c3; }

    .nl-icon {
      width:38px; height:38px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:15px;
    }
    .nl-body { flex:1; min-width:0; }
    .nl-titre { font-size:13.5px; font-weight:700; color:var(--text,#0f172a); margin-bottom:3px; }
    .nl-msg   { font-size:12.5px; color:var(--text-muted,#475569); line-height:1.4; margin-bottom:4px; }
    .nl-time  { font-size:11px; color:var(--text-muted,#94a3b8); }
    .nl-dot {
      width:9px; height:9px; border-radius:50%; background:#f59e0b;
      flex-shrink:0; margin-top:4px;
    }

    .nl-footer { padding:12px 20px; border-top:1.5px solid var(--border,#f1f5f9); }
    .nl-link {
      display:flex; align-items:center; gap:6px;
      font-size:13px; font-weight:700; color:#0f6cbd; text-decoration:none;
    }
    .nl-link:hover { gap:10px; }
  `]
})
export class NotificationsListComponent implements OnInit {
  @Input() showLink = false;
  @Input() linkUrl  = '/back/notifications';
  @Input() maxItems = 20;
  @Output() notifLoaded = new EventEmitter<any[]>();

  items: any[] = [];
  loading = true;

  get nonLues(): number { return this.items.filter(n => !n.lue).length; }

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const uid = this.auth.current()?.id;
    if (!uid) { this.loading = false; return; }
    this.api.notifications(uid).subscribe({
      next: d => {
        this.items = d.slice(0, this.maxItems);
        this.loading = false;
        this.notifLoaded.emit(this.items);
      },
      error: () => this.loading = false
    });
  }

  marquerLue(n: any): void {
    if (n.lue) return;
    this.api.marquerLue(n.id).subscribe(() => { n.lue = true; });
  }

  toutLire(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.marquerToutesLues(uid).subscribe(() => this.items.forEach(n => n.lue = true));
  }

  typeIcon(t: string): string {
    const m: Record<string,string> = {
      RAPPEL_RDV: 'fa-calendar-clock', RESULTAT_DISPONIBLE: 'fa-flask',
      RESULTAT_EXAMEN: 'fa-microscope', NOUVELLE_PRESCRIPTION: 'fa-prescription',
      FACTURE_GENEREE: 'fa-file-invoice-dollar', RDV_CONFIRME: 'fa-calendar-check',
      RDV_ANNULE: 'fa-calendar-xmark', INFORMATION: 'fa-circle-info'
    };
    return m[t] ?? 'fa-bell';
  }

  iconBg(t: string): string {
    const m: Record<string,string> = {
      RAPPEL_RDV:'#dbeafe', RESULTAT_DISPONIBLE:'#dcfce7', RESULTAT_EXAMEN:'#f3e8ff',
      NOUVELLE_PRESCRIPTION:'#f3e8ff', FACTURE_GENEREE:'#fef9c3',
      RDV_CONFIRME:'#dcfce7', RDV_ANNULE:'#fee2e2', INFORMATION:'#e0f2fe'
    };
    return m[t] ?? '#f1f5f9';
  }

  iconColor(t: string): string {
    const m: Record<string,string> = {
      RAPPEL_RDV:'#1d4ed8', RESULTAT_DISPONIBLE:'#15803d', RESULTAT_EXAMEN:'#7e22ce',
      NOUVELLE_PRESCRIPTION:'#7e22ce', FACTURE_GENEREE:'#854d0e',
      RDV_CONFIRME:'#15803d', RDV_ANNULE:'#b91c1c', INFORMATION:'#0369a1'
    };
    return m[t] ?? '#64748b';
  }
}
