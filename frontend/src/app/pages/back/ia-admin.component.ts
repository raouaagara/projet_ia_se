import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { IaService, JournalIA, Previsions, StatutIA } from '../../core/ia.service';
import { BarChartComponent, Barre } from '../../shared/bar-chart.component';

@Component({
  selector: 'app-ia-admin',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, DecimalPipe, BarChartComponent],
  template: `
    <div class="mc-page ia-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-wand-magic-sparkles"></i> IA &amp; aide à la décision</h1>
          <p class="mc-sub">Prévisions d'activité, risques d'annulation et de rupture, supervision des fonctions d'IA</p>
        </div>
        <button class="mc-btn" (click)="charger()"><i class="fa fa-rotate"></i> Actualiser</button>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
      <div class="mc-loading" *ngIf="!p && !erreur"><i class="fa fa-spinner fa-spin"></i> Analyse en cours…</div>

      <ng-container *ngIf="p && statut">
        <div class="mc-alert" [ngClass]="statut.modeleConnecte ? 'mc-alert-success' : 'mc-alert-info'">
          <i class="fa" [ngClass]="statut.modeleConnecte ? 'fa-plug-circle-check' : 'fa-circle-info'"></i>
          <div *ngIf="statut.modeleConnecte">Modèle de langage connecté : <strong>{{ statut.modele }}</strong> ({{ statut.fournisseur }}). Les réponses sont pseudonymisées et journalisées.</div>
          <div *ngIf="!statut.modeleConnecte">Aucune clé d'API n'est configurée : les fonctions d'IA utilisent le <strong>moteur de règles local</strong>.
            Pour connecter le modèle {{ statut.fournisseur }}, définissez la variable d'environnement <code>GROQ_API_KEY</code> sur le serveur.</div>
        </div>

        <div class="mc-kpis">
          <div class="mc-kpi"><div class="mc-kpi-icon tone-blue"><i class="fa fa-calendar-week"></i></div>
            <div><div class="mc-kpi-v">{{ totalPrevus() }}</div><div class="mc-kpi-l">Rendez-vous prévus sur 7 jours</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon" [ngClass]="p.tauxAnnulation >= 15 ? 'tone-orange' : 'tone-green'"><i class="fa fa-calendar-xmark"></i></div>
            <div><div class="mc-kpi-v">{{ p.tauxAnnulation | number:'1.0-1' }} %</div><div class="mc-kpi-l">Taux d'annulation ({{ p.semainesAnalysees }} semaines)</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon" [ngClass]="p.risquesRupture.length ? 'tone-red' : 'tone-green'"><i class="fa fa-pills"></i></div>
            <div><div class="mc-kpi-v">{{ p.risquesRupture.length }}</div><div class="mc-kpi-l">Médicaments à risque de rupture</div></div></div>
          <div class="mc-kpi"><div class="mc-kpi-icon tone-violet"><i class="fa fa-robot"></i></div>
            <div><div class="mc-kpi-v">{{ statut.appelsTotal }}</div><div class="mc-kpi-l">Appels IA journalisés · {{ statut.echecs }} échec(s)</div></div></div>
        </div>

        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-lightbulb"></i> Recommandations</div></div>
          <div class="mc-list">
            <div class="mc-list-item" *ngFor="let r of p.recommandations"><i class="fa fa-arrow-right ia-reco-ic"></i><div>{{ r }}</div></div>
          </div>
        </section>

        <div class="mc-grid-2">
          <section class="mc-panel">
            <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-chart-column"></i> Affluence prévue — 7 prochains jours</div></div>
            <div class="mc-panel-body">
              <app-bar-chart [donnees]="barresPrevision" unite="rendez-vous" titre="Rendez-vous prévus sur les 7 prochains jours"></app-bar-chart>
            </div>
            <div class="mc-scroll">
              <table class="mc-table">
                <thead><tr><th>Jour</th><th class="mc-num">Déjà planifiés</th><th class="mc-num">Prévus</th><th>Charge</th></tr></thead>
                <tbody>
                  <tr *ngFor="let j of p.prochainsJours">
                    <td>{{ j.jour }} {{ j.date | date:'dd/MM' }}</td>
                    <td class="mc-num">{{ j.dejaPlanifies }}</td>
                    <td class="mc-num mc-strong">{{ j.prevus }}</td>
                    <td><span class="mc-chip" [ngClass]="ton(j.charge)"><i class="fa" [ngClass]="icone(j.charge)"></i> {{ libelleCharge(j.charge) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="mc-panel">
            <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-chart-simple"></i> Moyenne de rendez-vous par jour</div></div>
            <div class="mc-panel-body">
              <app-bar-chart [donnees]="barresJours" unite="rendez-vous en moyenne" titre="Moyenne hebdomadaire de rendez-vous par jour"></app-bar-chart>
            </div>
            <div class="mc-scroll">
              <table class="mc-table">
                <thead><tr><th>Jour</th><th class="mc-num">Moyenne</th><th class="mc-num">Annulations</th></tr></thead>
                <tbody>
                  <tr *ngFor="let j of p.parJour">
                    <td>{{ j.jour }}</td><td class="mc-num">{{ j.moyenne | number:'1.0-1' }}</td><td class="mc-num">{{ j.tauxAnnulation | number:'1.0-1' }} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div class="mc-grid-2">
          <section class="mc-panel">
            <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-user-clock"></i> Créneaux à risque d'annulation</div></div>
            <div class="mc-empty" *ngIf="p.creneauxARisque.length === 0"><i class="fa fa-circle-check"></i>Aucun créneau à risque identifié.</div>
            <div class="mc-scroll" *ngIf="p.creneauxARisque.length">
              <table class="mc-table">
                <thead><tr><th>Créneau</th><th class="mc-num">Rendez-vous</th><th class="mc-num">Annulations</th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of p.creneauxARisque">
                    <td>{{ c.jour }} à {{ c.heure }} h</td><td class="mc-num">{{ c.rendezVous }}</td><td class="mc-num mc-strong">{{ c.tauxAnnulation | number:'1.0-1' }} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="mc-panel">
            <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-pills"></i> Risques de rupture (consommation des 30 derniers jours)</div></div>
            <div class="mc-empty" *ngIf="p.risquesRupture.length === 0"><i class="fa fa-circle-check"></i>Aucun risque de rupture dans les 30 prochains jours.</div>
            <div class="mc-scroll" *ngIf="p.risquesRupture.length">
              <table class="mc-table">
                <thead><tr><th>Médicament</th><th class="mc-num">Stock</th><th class="mc-num">Conso./jour</th><th class="mc-num">Couverture</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of p.risquesRupture">
                    <td>{{ r.medicament }}</td><td class="mc-num">{{ r.stock }}</td><td class="mc-num">{{ r.consommationJournaliere | number:'1.0-2' }}</td>
                    <td class="mc-num"><span class="mc-chip" [ngClass]="r.joursCouverture <= 14 ? 'tone-red' : 'tone-orange'">{{ r.joursCouverture }} j</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-list-check"></i> Journal des appels IA</div>
            <span class="mc-muted">{{ statut.appelsModele }} via le modèle · {{ statut.appelsRegles }} via les règles locales</span></div>
          <div class="mc-empty" *ngIf="journal.length === 0"><i class="fa fa-inbox"></i>Aucun appel enregistré.</div>
          <div class="mc-scroll" *ngIf="journal.length">
            <table class="mc-table">
              <thead><tr><th>Date</th><th>Fonction</th><th>Utilisateur</th><th>Source</th><th class="mc-num">Durée</th><th>Résultat</th></tr></thead>
              <tbody>
                <tr *ngFor="let j of journal.slice(0, 30)">
                  <td>{{ j.dateAppel | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>{{ libelleFonction(j.fonction) }}</td>
                  <td>{{ j.utilisateur || 'Visiteur' }} <span class="mc-muted">{{ j.role }}</span></td>
                  <td>{{ j.source === 'GROQ' ? 'Modèle (' + j.modele + ')' : 'Règles locales' }}</td>
                  <td class="mc-num">{{ j.dureeMs }} ms</td>
                  <td><span class="mc-chip" [ngClass]="j.succes ? 'tone-green' : 'tone-red'"><i class="fa" [ngClass]="j.succes ? 'fa-check' : 'fa-xmark'"></i> {{ j.succes ? 'Réussi' : 'Échec' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .ia-page { --mc-accent:#6250d6; }
    .ia-reco-ic { color:#6250d6; margin-top:3px; }
    code { background:var(--bg); padding:1px 5px; border-radius:4px; font-size:12.5px; }
  `]
})
export class IaAdminComponent implements OnInit {
  p?: Previsions;
  statut?: StatutIA;
  journal: JournalIA[] = [];
  barresPrevision: Barre[] = [];
  barresJours: Barre[] = [];
  erreur = '';

  constructor(private ia: IaService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.erreur = '';
    forkJoin({ p: this.ia.previsions(), statut: this.ia.statut(), journal: this.ia.journal() }).subscribe({
      next: r => {
        this.p = r.p;
        this.statut = r.statut;
        this.journal = r.journal;
        this.barresPrevision = r.p.prochainsJours.map(j => ({
          libelle: j.jour.slice(0, 3) + ' ' + j.date.slice(8, 10),
          valeur: j.prevus,
          detail: `dont ${j.dejaPlanifies} déjà planifié(s)`
        }));
        this.barresJours = r.p.parJour.map(j => ({ libelle: j.jour.slice(0, 3), valeur: j.moyenne, detail: `${j.tauxAnnulation} % d'annulations` }));
      },
      error: () => this.erreur = 'Impossible de charger les prévisions.'
    });
  }

  totalPrevus(): number { return this.p?.prochainsJours.reduce((s, j) => s + j.prevus, 0) ?? 0; }

  libelleCharge(c: string): string { return ({ FORTE: 'Forte', NORMALE: 'Normale', FAIBLE: 'Faible' } as Record<string, string>)[c] ?? c; }
  ton(c: string): string { return ({ FORTE: 'tone-orange', NORMALE: 'tone-gray', FAIBLE: 'tone-blue' } as Record<string, string>)[c] ?? 'tone-gray'; }
  icone(c: string): string { return ({ FORTE: 'fa-arrow-trend-up', NORMALE: 'fa-minus', FAIBLE: 'fa-arrow-trend-down' } as Record<string, string>)[c] ?? 'fa-minus'; }

  libelleFonction(f: string): string {
    return ({ ASSISTANT: 'Assistant MediAssist', TRIAGE: 'Pré-diagnostic', RESUME_DOSSIER: 'Résumé de dossier', INTERPRETATION_RESULTAT: 'Interprétation de résultat' } as Record<string, string>)[f] ?? f;
  }
}
