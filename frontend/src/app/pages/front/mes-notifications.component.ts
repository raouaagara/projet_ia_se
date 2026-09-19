import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { NotificationsListComponent } from '../../shared/notifications-list.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-mes-notifications',
  standalone: true,
  imports: [NgIf, NotificationsListComponent],
  template: `
    <div class="mn-page">

      <div class="mn-header">
        <div>
          <h2 class="mn-title">
            <i class="fa fa-bell"></i> Mes notifications
            <span class="mn-badge" *ngIf="nonLues > 0">{{ nonLues }}</span>
          </h2>
          <p class="mn-sub">Résultats d'examens, prescriptions, rappels de rendez-vous</p>
        </div>
      </div>

      <div class="mn-card">
        <app-notifications-list
          [maxItems]="50"
          [showLink]="false"
          (notifLoaded)="onLoaded($event)">
        </app-notifications-list>
      </div>

    </div>
  `,
  styles: [`
    .mn-page { display:flex; flex-direction:column; gap:20px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    .mn-header {
      background:linear-gradient(135deg,#f59e0b,#f97316); border-radius:18px;
      padding:24px 28px; color:#fff;
    }
    .mn-title {
      font-size:22px; font-weight:900; margin:0 0 6px;
      display:flex; align-items:center; gap:10px;
    }
    .mn-sub { font-size:13px; color:rgba(255,255,255,.8); margin:0; }
    .mn-badge {
      min-width:24px; height:24px; border-radius:999px; padding:0 6px;
      background:#fff; color:#f97316; font-size:12px; font-weight:900;
      display:inline-flex; align-items:center; justify-content:center;
    }
    .mn-card {
      background:var(--surface,#fff); border-radius:18px;
      border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 2px 10px rgba(0,0,0,.05); overflow:hidden;
    }
  `]
})
export class MesNotificationsComponent implements OnInit {
  nonLues = 0;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.countNotificationsNonLues(uid).subscribe((r: any) => {
      this.nonLues = r?.count ?? 0;
    });
  }

  onLoaded(items: any[]): void {
    this.nonLues = items.filter(n => !n.lue).length;
  }
}
