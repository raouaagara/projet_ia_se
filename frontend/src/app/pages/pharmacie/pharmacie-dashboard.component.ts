import { MontantPipe } from '../../shared/montant.pipe';
import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlerteStock, Delivrance, Ordonnance, PharmacieService, TableauBordPharmacie } from '../../core/pharmacie.service';

@Component({
  selector: 'app-pharmacie-dashboard',
  standalone: true,
  imports: [MontantPipe, NgIf, NgFor, NgClass, RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-gauge-high"></i> Tableau de bord</h1>
          <p class="mc-sub">Vue d'ensemble du stock, des alertes et des ordonnances à délivrer</p>
        </div>
        <button class="mc-btn" (click)="charger()"><i class="fa fa-rotate"></i> Actualiser</button>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
      <div class="mc-loading" *ngIf="!t && !erreur"><i class="fa fa-spinner fa-spin"></i> Chargement…</div>

      <ng-container *ngIf="t">
        <div class="mc-kpis">
          <div class="mc-kpi"><div class="mc-kpi-icon tone-teal"><i class="fa fa-file-prescription"></i></div>
            <div><div class="mc-kpi-v">{{ t.ordonnancesADelivrer }}</div><div class="mc-kpi-l">Ordonnances à délivrer</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon tone-green"><i class="fa fa-hand-holding-medical"></i></div>
            <div><div class="mc-kpi-v">{{ t.delivrancesAujourdhui }}</div><div class="mc-kpi-l">Délivrances aujourd'hui</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon tone-blue"><i class="fa fa-capsules"></i></div>
            <div><div class="mc-kpi-v">{{ t.unitesEnStock | number:'1.0-0' }}</div><div class="mc-kpi-l">Unités en stock · {{ t.medicamentsActifs }} médicaments</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon tone-violet"><i class="fa fa-coins"></i></div>
            <div><div class="mc-kpi-v">{{ t.valeurStock | montant:0 }}</div><div class="mc-kpi-l">Valeur du stock (prix public)</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon" [ngClass]="t.ruptures + t.lotsPerimes > 0 ? 'tone-red' : 'tone-gray'"><i class="fa fa-triangle-exclamation"></i></div>
            <div><div class="mc-kpi-v">{{ t.ruptures + t.lotsPerimes }}</div><div class="mc-kpi-l">Alertes critiques</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon" [ngClass]="t.stocksBas + t.peremptionsProches > 0 ? 'tone-orange' : 'tone-gray'"><i class="fa fa-hourglass-half"></i></div>
            <div><div class="mc-kpi-v">{{ t.stocksBas + t.peremptionsProches }}</div><div class="mc-kpi-l">Points d'attention</div></div></div>
        </div>

        <div class="mc-grid-2">
          <section class="mc-panel">
            <div class="mc-panel-head">
              <div class="mc-panel-title"><i class="fa fa-bell"></i> Alertes de stock</div>
              <a class="mc-btn mc-btn-sm" routerLink="/pharmacie/stock">Voir le stock</a>
            </div>
            <div class="mc-empty" *ngIf="alertes.length === 0"><i class="fa fa-circle-check"></i>Aucune alerte : le stock est conforme.</div>
            <div class="mc-list">
              <div class="mc-list-item" *ngFor="let a of alertes.slice(0, 8)">
                <span class="mc-chip" [ngClass]="a.niveau === 'CRITIQUE' ? 'tone-red' : 'tone-orange'">{{ libelleAlerte(a.type) }}</span>
                <div>
                  <div class="mc-strong">{{ a.medicamentNom }} <span class="mc-muted" *ngIf="a.numeroLot">· lot {{ a.numeroLot }}</span></div>
                  <div class="mc-muted">{{ a.message }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="mc-panel">
            <div class="mc-panel-head">
              <div class="mc-panel-title"><i class="fa fa-file-prescription"></i> Ordonnances en attente</div>
              <a class="mc-btn mc-btn-sm mc-btn-primary" routerLink="/pharmacie/ordonnances">Délivrer</a>
            </div>
            <div class="mc-empty" *ngIf="ordonnances.length === 0"><i class="fa fa-inbox"></i>Aucune ordonnance en attente de délivrance.</div>
            <div class="mc-list">
              <a class="mc-list-item pd-link" *ngFor="let o of ordonnances.slice(0, 6)" [routerLink]="['/pharmacie/ordonnances']" [queryParams]="{ id: o.id }">
                <span class="mc-chip" [ngClass]="o.statutDelivrance === 'PARTIELLE' ? 'tone-orange' : 'tone-teal'">{{ o.statutDelivrance === 'PARTIELLE' ? 'Partielle' : 'À délivrer' }}</span>
                <div>
                  <div class="mc-strong">Ordonnance n° {{ o.id }} — {{ o.patientNom }}</div>
                  <div class="mc-muted">{{ o.medecinNom }} · {{ o.dateEmission | date:'dd/MM/yyyy' }} · {{ o.lignes.length }} médicament(s)</div>
                </div>
              </a>
            </div>
          </section>
        </div>

        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-clock-rotate-left"></i> Dernières délivrances</div></div>
          <div class="mc-empty" *ngIf="delivrances.length === 0"><i class="fa fa-inbox"></i>Aucune délivrance enregistrée.</div>
          <div class="mc-scroll" *ngIf="delivrances.length > 0">
            <table class="mc-table">
              <thead><tr><th>Date</th><th>Ordonnance</th><th>Patient</th><th>Statut</th><th class="mc-num">Montant</th><th>Facture</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of delivrances.slice(0, 8)">
                  <td>{{ d.dateDelivrance | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>n° {{ d.ordonnanceId }}</td>
                  <td>{{ d.patientNom }} <span class="mc-muted">{{ d.numeroDossier }}</span></td>
                  <td><span class="mc-chip" [ngClass]="d.statut === 'COMPLETE' ? 'tone-green' : 'tone-orange'">{{ d.statut === 'COMPLETE' ? 'Complète' : 'Partielle' }}</span></td>
                  <td class="mc-num">{{ d.montantTotal | montant }}</td>
                  <td>{{ d.numeroFacture || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`.pd-link { text-decoration:none; color:inherit; } .pd-link:hover { background:var(--bg); }`]
})
export class PharmacieDashboardComponent implements OnInit {
  t?: TableauBordPharmacie;
  alertes: AlerteStock[] = [];
  ordonnances: Ordonnance[] = [];
  delivrances: Delivrance[] = [];
  erreur = '';

  constructor(private pharmacie: PharmacieService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.erreur = '';
    forkJoin({
      t: this.pharmacie.tableauDeBord(),
      alertes: this.pharmacie.alertes(),
      ordonnances: this.pharmacie.ordonnancesADelivrer(),
      delivrances: this.pharmacie.delivrances()
    }).subscribe({
      next: r => { this.t = r.t; this.alertes = r.alertes; this.ordonnances = r.ordonnances; this.delivrances = r.delivrances; },
      error: () => this.erreur = 'Impossible de charger le tableau de bord. Vérifiez votre connexion puis réessayez.'
    });
  }

  libelleAlerte(type: string): string {
    return ({ RUPTURE: 'Rupture', STOCK_BAS: 'Stock bas', PERIME: 'Périmé', PEREMPTION_PROCHE: 'Péremption proche' } as Record<string, string>)[type] ?? type;
  }
}
