import { Routes } from '@angular/router';
import { PharmacieLayoutComponent } from '../../layouts/pharmacie-layout.component';
import { PharmacieDashboardComponent } from './pharmacie-dashboard.component';
import { PharmacieOrdonnancesComponent } from './pharmacie-ordonnances.component';
import { PharmacieStockComponent } from './pharmacie-stock.component';
import { PharmacieReceptionsComponent } from './pharmacie-receptions.component';
import { PharmacieCatalogueComponent } from './pharmacie-catalogue.component';
import { PharmacieNotificationsComponent } from './pharmacie-notifications.component';

/** Espace Pharmacie (module M6), chargé à la demande. */
export const PHARMACIE_ROUTES: Routes = [
  {
    path: '',
    component: PharmacieLayoutComponent,
    children: [
      { path: '',                redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      { path: 'tableau-de-bord', component: PharmacieDashboardComponent, title: 'Pharmacie — Tableau de bord' },
      { path: 'ordonnances',     component: PharmacieOrdonnancesComponent, title: 'Pharmacie — Ordonnances' },
      { path: 'stock',           component: PharmacieStockComponent, title: 'Pharmacie — Stock' },
      { path: 'receptions',      component: PharmacieReceptionsComponent, title: 'Pharmacie — Réceptions' },
      { path: 'catalogue',       component: PharmacieCatalogueComponent, title: 'Pharmacie — Catalogue' },
      { path: 'notifications',   component: PharmacieNotificationsComponent, title: 'Pharmacie — Notifications' }
    ]
  }
];
