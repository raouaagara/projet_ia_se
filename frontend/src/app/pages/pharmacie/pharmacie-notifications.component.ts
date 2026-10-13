import { Component } from '@angular/core';
import { NotificationsListComponent } from '../../shared/notifications-list.component';

@Component({
  selector: 'app-pharmacie-notifications',
  standalone: true,
  imports: [NotificationsListComponent],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-bell"></i> Notifications</h1>
          <p class="mc-sub">Alertes de stock et informations de la pharmacie</p>
        </div>
      </div>
      <section class="mc-panel">
        <app-notifications-list [maxItems]="50" [showLink]="false"></app-notifications-list>
      </section>
    </div>
  `
})
export class PharmacieNotificationsComponent {}
