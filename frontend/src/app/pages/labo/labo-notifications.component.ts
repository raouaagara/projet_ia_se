import { Component } from '@angular/core';
import { NotificationsListComponent } from '../../shared/notifications-list.component';

@Component({
  selector: 'app-labo-notifications',
  standalone: true,
  imports: [NotificationsListComponent],
  template: `
    <div style="background:var(--surface,#fff);border-radius:18px;border:1.5px solid var(--border,#e2e8f0);overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05)">
      <app-notifications-list [maxItems]="50" [showLink]="false"></app-notifications-list>
    </div>
  `
})
export class LaboNotificationsComponent {}
