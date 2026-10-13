import { MontantPipe, formatMontant } from '../../shared/montant.pipe';
import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Delivrance, Ordonnance, PharmacieService } from '../../core/pharmacie.service';

@Component({
  selector: 'app-pharmacie-ordonnances',
  standalone: true,
  imports: [MontantPipe, NgIf, NgFor, NgClass, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-file-prescription"></i> Délivrance des ordonnances</h1>
          <p class="mc-sub">Les lots sont prélevés automatiquement du plus proche de la péremption au plus lointain (règle FEFO)</p>
        </div>
        <div class="mc-tabs">
          <button class="mc-tab" [class.active]="onglet === 'attente'" (click)="onglet = 'attente'">À délivrer ({{ ordonnances.length }})</button>
          <button class="mc-tab" [class.active]="onglet === 'historique'" (click)="onglet = 'historique'; chargerHistorique()">Historique</button>
        </div>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>

      <div class="mc-grid-main" *ngIf="onglet === 'attente'">
        <section class="mc-panel">
          <div class="mc-panel-head">
            <div class="mc-search"><i class="fa fa-magnifying-glass"></i>
              <input [(ngModel)]="recherche" placeholder="Patient, dossier ou n°" aria-label="Rechercher une ordonnance par patient, numéro de dossier ou numéro d'ordonnance">
            </div>
          </div>
          <div class="mc-loading" *ngIf="chargement"><i class="fa fa-spinner fa-spin"></i> Chargement…</div>
          <div class="mc-empty" *ngIf="!chargement && filtrees().length === 0"><i class="fa fa-inbox"></i>Aucune ordonnance à délivrer.</div>
          <div class="mc-list">
            <button class="mc-list-item po-item" *ngFor="let o of filtrees()" [class.po-active]="o.id === selection?.id" (click)="choisir(o)">
              <span class="mc-chip" [ngClass]="o.statutDelivrance === 'PARTIELLE' ? 'tone-orange' : 'tone-teal'">{{ o.statutDelivrance === 'PARTIELLE' ? 'Partielle' : 'À délivrer' }}</span>
              <div class="po-txt">
                <div class="mc-strong">N° {{ o.id }} — {{ o.patientNom }}</div>
                <div class="mc-muted">{{ o.numeroDossier }} · {{ o.medecinNom }} · {{ o.dateEmission | date:'dd/MM/yyyy' }}</div>
              </div>
            </button>
          </div>
        </section>

        <section class="mc-panel" *ngIf="!selection && !resultat">
          <div class="mc-empty"><i class="fa fa-hand-pointer"></i>Sélectionnez une ordonnance pour préparer la délivrance.</div>
        </section>

        <section class="mc-panel" *ngIf="selection && !resultat">
          <div class="mc-panel-head">
            <div>
              <div class="mc-panel-title"><i class="fa fa-file-medical"></i> Ordonnance n° {{ selection.id }}</div>
              <div class="mc-muted">{{ selection.patientNom }} ({{ selection.numeroDossier }}) · prescrite par {{ selection.medecinNom }} le {{ selection.dateEmission | date:'dd/MM/yyyy' }}</div>
            </div>
          </div>
          <div class="mc-scroll">
            <table class="mc-table">
              <thead><tr><th>Médicament</th><th>Posologie</th><th class="mc-num">Prescrit</th><th class="mc-num">Délivré</th><th class="mc-num">Stock</th><th class="mc-num">À délivrer</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of selection.lignes">
                  <td class="mc-strong">{{ l.medicamentNom }}</td>
                  <td class="mc-muted">{{ l.posologie || '—' }}<span *ngIf="l.dureeJours"> · {{ l.dureeJours }} j</span></td>
                  <td class="mc-num">{{ l.quantite }}</td>
                  <td class="mc-num">{{ l.quantiteDelivree }}</td>
                  <td class="mc-num"><span [class.po-low]="(l.stockDisponible ?? 0) < (l.resteADelivrer ?? 0)">{{ l.stockDisponible }}</span></td>
                  <td class="mc-num">
                    <input type="number" min="0" [max]="l.resteADelivrer ?? 0" [(ngModel)]="quantites[l.id!]" [disabled]="!l.resteADelivrer" [attr.aria-label]="'Quantité à délivrer pour ' + l.medicamentNom">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mc-panel-body">
            <div class="mc-alert mc-alert-warning" *ngIf="stockInsuffisant()"><i class="fa fa-triangle-exclamation"></i>
              Le stock ne couvre pas toutes les quantités : la délivrance sera partielle et le reste pourra être servi après réapprovisionnement.</div>
            <p class="mc-muted" *ngIf="selection.instructions">Instructions du médecin : {{ selection.instructions }}</p>
            <div class="mc-actions">
              <label class="mc-check"><input type="checkbox" [(ngModel)]="facturer"> Ajouter les médicaments à la facture du patient</label>
              <button class="mc-btn" (click)="selection = undefined">Annuler</button>
              <button class="mc-btn mc-btn-primary" (click)="delivrer()" [disabled]="envoi || totalADelivrer() === 0">
                <i class="fa" [ngClass]="envoi ? 'fa-spinner fa-spin' : 'fa-hand-holding-medical'"></i> Délivrer {{ totalADelivrer() }} unité(s)
              </button>
            </div>
          </div>
        </section>

        <section class="mc-panel" *ngIf="resultat">
          <div class="mc-panel-head">
            <div class="mc-panel-title"><i class="fa fa-circle-check"></i> Bon de délivrance</div>
            <div class="mc-actions">
              <button class="mc-btn mc-btn-sm" (click)="imprimer(resultat)"><i class="fa fa-print"></i> Imprimer</button>
              <button class="mc-btn mc-btn-sm mc-btn-primary" (click)="resultat = undefined">Terminer</button>
            </div>
          </div>
          <div class="mc-panel-body">
            <div class="mc-alert" [ngClass]="resultat.statut === 'COMPLETE' ? 'mc-alert-success' : 'mc-alert-warning'">
              <i class="fa" [ngClass]="resultat.statut === 'COMPLETE' ? 'fa-circle-check' : 'fa-triangle-exclamation'"></i>
              <div>
                Ordonnance n° {{ resultat.ordonnanceId }} délivrée {{ resultat.statut === 'COMPLETE' ? 'en totalité' : 'partiellement' }} à {{ resultat.patientNom }}.
                <span *ngIf="resultat.numeroFacture"> Facture {{ resultat.numeroFacture }} émise.</span>
                <div *ngFor="let a of resultat.avertissements">{{ a }}</div>
              </div>
            </div>
          </div>
          <div class="mc-scroll">
            <table class="mc-table">
              <thead><tr><th>Médicament</th><th>Lot</th><th>Péremption</th><th class="mc-num">Qté</th><th class="mc-num">Prix unitaire</th><th class="mc-num">Total</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of resultat.lignes">
                  <td>{{ l.medicamentNom }}</td><td>{{ l.numeroLot }}</td><td>{{ l.datePeremption | date:'dd/MM/yyyy' }}</td>
                  <td class="mc-num">{{ l.quantite }}</td><td class="mc-num">{{ l.prixUnitaire | montant }}</td><td class="mc-num">{{ l.total | montant }}</td>
                </tr>
                <tr><td colspan="5" class="mc-strong">Total</td><td class="mc-num mc-strong">{{ resultat.montantTotal | montant }}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="mc-panel" *ngIf="onglet === 'historique'">
        <div class="mc-empty" *ngIf="historique.length === 0"><i class="fa fa-inbox"></i>Aucune délivrance enregistrée.</div>
        <div class="mc-scroll" *ngIf="historique.length > 0">
          <table class="mc-table">
            <thead><tr><th>Date</th><th>Ordonnance</th><th>Patient</th><th>Médecin</th><th>Pharmacien</th><th>Statut</th><th class="mc-num">Montant</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let d of historique">
                <td>{{ d.dateDelivrance | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>n° {{ d.ordonnanceId }}</td>
                <td>{{ d.patientNom }} <span class="mc-muted">{{ d.numeroDossier }}</span></td>
                <td>{{ d.medecinNom }}</td>
                <td>{{ d.pharmacienNom || '—' }}</td>
                <td><span class="mc-chip" [ngClass]="d.statut === 'COMPLETE' ? 'tone-green' : 'tone-orange'">{{ d.statut === 'COMPLETE' ? 'Complète' : 'Partielle' }}</span></td>
                <td class="mc-num">{{ d.montantTotal | montant }}</td>
                <td><button class="mc-btn mc-btn-sm" (click)="imprimer(d)" title="Imprimer le bon"><i class="fa fa-print"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .po-item { width:100%; text-align:left; background:none; border:none; border-bottom:1px solid var(--border); cursor:pointer; font:inherit; color:inherit; }
    .po-item:hover, .po-active { background:var(--bg); }
    .po-active { box-shadow: inset 3px 0 0 var(--mc-accent); }
    .po-txt { min-width:0; }
    .po-low { color:#b91c1c; font-weight:700; }
  `]
})
export class PharmacieOrdonnancesComponent implements OnInit {
  onglet: 'attente' | 'historique' = 'attente';
  ordonnances: Ordonnance[] = [];
  historique: Delivrance[] = [];
  selection?: Ordonnance;
  resultat?: Delivrance;
  quantites: Record<number, number> = {};
  facturer = true;
  recherche = '';
  chargement = true;
  envoi = false;
  erreur = '';

  constructor(private pharmacie: PharmacieService, private route: ActivatedRoute) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true;
    this.pharmacie.ordonnancesADelivrer().subscribe({
      next: o => {
        this.ordonnances = o;
        this.chargement = false;
        const id = Number(this.route.snapshot.queryParamMap.get('id'));
        const cible = id ? o.find(x => x.id === id) : undefined;
        if (cible) this.choisir(cible);
      },
      error: () => { this.chargement = false; this.erreur = 'Impossible de charger les ordonnances.'; }
    });
  }

  chargerHistorique(): void {
    this.pharmacie.delivrances().subscribe({ next: d => this.historique = d, error: () => this.erreur = 'Impossible de charger l\'historique.' });
  }

  filtrees(): Ordonnance[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.ordonnances;
    return this.ordonnances.filter(o => `${o.id} ${o.patientNom} ${o.numeroDossier}`.toLowerCase().includes(q));
  }

  choisir(o: Ordonnance): void {
    this.selection = o;
    this.resultat = undefined;
    this.erreur = '';
    this.quantites = {};
    for (const l of o.lignes) {
      this.quantites[l.id!] = Math.min(l.resteADelivrer ?? 0, l.stockDisponible ?? 0);
    }
  }

  totalADelivrer(): number {
    return Object.values(this.quantites).reduce((s, q) => s + (Number(q) || 0), 0);
  }

  stockInsuffisant(): boolean {
    return !!this.selection?.lignes.some(l => (l.stockDisponible ?? 0) < (l.resteADelivrer ?? 0));
  }

  delivrer(): void {
    if (!this.selection) return;
    this.envoi = true;
    this.erreur = '';
    const lignes = this.selection.lignes
      .filter(l => l.id && (Number(this.quantites[l.id]) || 0) > 0)
      .map(l => ({ ligneOrdonnanceId: l.id!, quantite: Number(this.quantites[l.id!]) }));
    this.pharmacie.delivrer({ ordonnanceId: this.selection.id!, lignes, facturer: this.facturer }).subscribe({
      next: d => { this.envoi = false; this.resultat = d; this.selection = undefined; this.charger(); },
      error: (e: HttpErrorResponse) => { this.envoi = false; this.erreur = e.error?.message ?? 'La délivrance a échoué.'; }
    });
  }

  imprimer(d: Delivrance): void {
    const e = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
    const lignes = d.lignes.map(l => `<tr><td>${e(l.medicamentNom)}</td><td>${e(l.numeroLot)}</td><td>${l.quantite}</td><td style="text-align:right">${formatMontant(l.total)}</td></tr>`).join('');
    const w = window.open('', '_blank', 'width=720,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bon de délivrance n° ${d.id}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:18px}
      td,th{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}.muted{color:#64748b;font-size:13px}</style></head><body>
      <h1>MediCare — Bon de délivrance n° ${d.id}</h1>
      <div class="muted">${new Date(d.dateDelivrance).toLocaleString('fr-FR')} · Ordonnance n° ${d.ordonnanceId} · ${e(d.medecinNom)}</div>
      <p><strong>Patient :</strong> ${e(d.patientNom)} (${e(d.numeroDossier)})${d.numeroFacture ? ' · <strong>Facture :</strong> ' + e(d.numeroFacture) : ''}</p>
      <table><thead><tr><th>Médicament</th><th>Lot</th><th>Qté</th><th style="text-align:right">Total</th></tr></thead><tbody>${lignes}
      <tr><td colspan="3"><strong>Total</strong></td><td style="text-align:right"><strong>${formatMontant(d.montantTotal)}</strong></td></tr></tbody></table>
      <p class="muted">Délivré par : ${e(d.pharmacienNom ?? '—')}</p></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }
}
