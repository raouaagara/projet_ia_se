import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Lot, Medicament, Mouvement, PharmacieService } from '../../core/pharmacie.service';

type Filtre = 'tous' | 'alertes' | 'rupture';

@Component({
  selector: 'app-pharmacie-stock',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-boxes-stacked"></i> Stock</h1>
          <p class="mc-sub">Quantités disponibles par médicament et par lot (les lots périmés ne sont pas comptés)</p>
        </div>
        <div class="mc-tabs">
          <button class="mc-tab" [class.active]="onglet === 'stock'" (click)="onglet = 'stock'">État du stock</button>
          <button class="mc-tab" [class.active]="onglet === 'mouvements'" (click)="onglet = 'mouvements'; chargerMouvements()">Mouvements</button>
        </div>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
      <div class="mc-alert mc-alert-success" *ngIf="succes"><i class="fa fa-circle-check"></i> {{ succes }}</div>

      <section class="mc-panel" *ngIf="onglet === 'stock'">
        <div class="mc-panel-head">
          <div class="mc-search"><i class="fa fa-magnifying-glass"></i>
            <input [(ngModel)]="recherche" placeholder="Rechercher un médicament, une DCI ou un code" aria-label="Rechercher dans le stock">
          </div>
          <div class="mc-actions">
            <div class="mc-tabs">
              <button class="mc-tab" [class.active]="filtre === 'tous'" (click)="filtre = 'tous'">Tous</button>
              <button class="mc-tab" [class.active]="filtre === 'alertes'" (click)="filtre = 'alertes'">Sous le seuil</button>
              <button class="mc-tab" [class.active]="filtre === 'rupture'" (click)="filtre = 'rupture'">En rupture</button>
            </div>
            <button class="mc-btn mc-btn-sm" *ngIf="lotsPerimes() > 0" (click)="retirerPerimes()"><i class="fa fa-trash-can"></i> Retirer {{ lotsPerimes() }} lot(s) périmé(s)</button>
          </div>
        </div>
        <div class="mc-loading" *ngIf="chargement"><i class="fa fa-spinner fa-spin"></i> Chargement…</div>
        <div class="mc-empty" *ngIf="!chargement && filtres().length === 0"><i class="fa fa-inbox"></i>Aucun médicament ne correspond.</div>
        <div class="mc-scroll" *ngIf="!chargement && filtres().length > 0">
          <table class="mc-table">
            <thead><tr><th></th><th>Code</th><th>Médicament</th><th class="mc-num">Stock</th><th class="mc-num">Seuil</th><th>État</th><th>Prochaine péremption</th><th class="mc-num">Lots</th></tr></thead>
            <tbody>
              <ng-container *ngFor="let m of filtres()">
                <tr class="mc-row-click" [class.mc-row-active]="ouvert === m.id" (click)="ouvert = ouvert === m.id ? undefined : m.id">
                  <td><i class="fa" [ngClass]="ouvert === m.id ? 'fa-chevron-down' : 'fa-chevron-right'"></i></td>
                  <td class="mc-muted">{{ m.code }}</td>
                  <td><span class="mc-strong">{{ m.libelle }}</span> <span class="mc-muted" *ngIf="!m.actif">· désactivé</span></td>
                  <td class="mc-num mc-strong">{{ m.stockDisponible }}</td>
                  <td class="mc-num">{{ m.seuilAlerte }}</td>
                  <td><span class="mc-chip" [ngClass]="etat(m).ton">{{ etat(m).libelle }}</span></td>
                  <td>{{ m.prochainePeremption ? (m.prochainePeremption | date:'dd/MM/yyyy') : '—' }}</td>
                  <td class="mc-num">{{ m.lots?.length ?? 0 }}</td>
                </tr>
                <tr *ngIf="ouvert === m.id">
                  <td colspan="8" class="ps-lots">
                    <div class="mc-empty" *ngIf="!m.lots?.length">Aucun lot réceptionné pour ce médicament.</div>
                    <table class="mc-table" *ngIf="m.lots?.length">
                      <thead><tr><th>Lot</th><th>Fournisseur</th><th>Réception</th><th>Péremption</th><th class="mc-num">Restant / initial</th><th></th></tr></thead>
                      <tbody>
                        <tr *ngFor="let l of m.lots">
                          <td class="mc-strong">{{ l.numeroLot }}</td>
                          <td>{{ l.fournisseurNom || '—' }}</td>
                          <td>{{ l.dateReception | date:'dd/MM/yyyy' }}</td>
                          <td>
                            {{ l.datePeremption | date:'dd/MM/yyyy' }}
                            <span class="mc-chip tone-red" *ngIf="l.perime">Périmé</span>
                            <span class="mc-chip tone-orange" *ngIf="!l.perime && l.joursAvantPeremption <= 30 && l.quantiteRestante > 0">J-{{ l.joursAvantPeremption }}</span>
                          </td>
                          <td class="mc-num">{{ l.quantiteRestante }} / {{ l.quantiteInitiale }}</td>
                          <td class="mc-num"><button class="mc-btn mc-btn-sm" (click)="ouvrirAjustement(l)"><i class="fa fa-pen-to-square"></i> Ajuster</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mc-panel" *ngIf="onglet === 'mouvements'">
        <div class="mc-panel-head">
          <div class="mc-panel-title"><i class="fa fa-right-left"></i> Historique des mouvements</div>
          <div class="mc-tabs">
            <button class="mc-tab" *ngFor="let t of typesMouvement" [class.active]="typeMouvement === t.valeur" (click)="typeMouvement = t.valeur; chargerMouvements()">{{ t.libelle }}</button>
          </div>
        </div>
        <div class="mc-empty" *ngIf="mouvements.length === 0"><i class="fa fa-inbox"></i>Aucun mouvement.</div>
        <div class="mc-scroll" *ngIf="mouvements.length > 0">
          <table class="mc-table">
            <thead><tr><th>Date</th><th>Type</th><th>Médicament</th><th>Lot</th><th class="mc-num">Quantité</th><th>Motif</th><th>Par</th></tr></thead>
            <tbody>
              <tr *ngFor="let mv of mouvements">
                <td>{{ mv.dateMouvement | date:'dd/MM/yyyy HH:mm' }}</td>
                <td><span class="mc-chip" [ngClass]="tonMouvement(mv.type)">{{ libelleMouvement(mv.type) }}</span></td>
                <td>{{ mv.medicamentNom }}</td>
                <td>{{ mv.numeroLot }}</td>
                <td class="mc-num mc-strong" [class.ps-neg]="mv.quantite < 0">{{ mv.quantite > 0 ? '+' : '' }}{{ mv.quantite }}</td>
                <td class="mc-muted">{{ mv.motif }}</td>
                <td>{{ mv.utilisateurNom || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="mc-overlay" *ngIf="lotAjuste" (click)="lotAjuste = undefined">
      <div class="mc-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="ajust-titre">
        <div class="mc-modal-head">
          <div class="mc-modal-title" id="ajust-titre"><i class="fa fa-pen-to-square"></i> Ajuster le lot {{ lotAjuste.numeroLot }}</div>
          <button class="mc-close" (click)="lotAjuste = undefined" aria-label="Fermer"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="mc-modal-body">
          <p class="mc-muted">{{ lotAjuste.medicamentNom }} — quantité actuelle : <strong>{{ lotAjuste.quantiteRestante }}</strong></p>
          <div class="mc-form">
            <div class="mc-field"><label for="aj-q">Quantité comptée <span class="req">*</span></label>
              <input id="aj-q" type="number" min="0" [(ngModel)]="nouvelleQuantite"></div>
            <div class="mc-field mc-field-wide"><label for="aj-m">Motif <span class="req">*</span></label>
              <input id="aj-m" [(ngModel)]="motif" placeholder="Ex. inventaire mensuel, casse, retour fournisseur"></div>
          </div>
          <div class="mc-alert mc-alert-error" *ngIf="erreurAjustement"><i class="fa fa-circle-exclamation"></i> {{ erreurAjustement }}</div>
        </div>
        <div class="mc-modal-foot">
          <button class="mc-btn" (click)="lotAjuste = undefined">Annuler</button>
          <button class="mc-btn mc-btn-primary" (click)="ajuster()" [disabled]="!motif.trim() || nouvelleQuantite === null || nouvelleQuantite < 0">Enregistrer l'ajustement</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ps-lots { background:var(--bg); padding:12px 18px !important; }
    .ps-lots .mc-table { background:var(--surface); border-radius:10px; overflow:hidden; }
    .ps-neg { color:#b91c1c; }
  `]
})
export class PharmacieStockComponent implements OnInit {
  onglet: 'stock' | 'mouvements' = 'stock';
  medicaments: Medicament[] = [];
  mouvements: Mouvement[] = [];
  filtre: Filtre = 'tous';
  recherche = '';
  ouvert?: number;
  chargement = true;
  erreur = '';
  succes = '';
  typeMouvement = '';
  readonly typesMouvement = [
    { valeur: '', libelle: 'Tous' }, { valeur: 'ENTREE', libelle: 'Entrées' }, { valeur: 'SORTIE', libelle: 'Sorties' },
    { valeur: 'AJUSTEMENT', libelle: 'Ajustements' }, { valeur: 'PEREMPTION', libelle: 'Péremptions' }
  ];

  lotAjuste?: Lot;
  nouvelleQuantite: number | null = null;
  motif = '';
  erreurAjustement = '';

  constructor(private pharmacie: PharmacieService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true;
    this.pharmacie.stock().subscribe({
      next: m => { this.medicaments = m; this.chargement = false; },
      error: () => { this.chargement = false; this.erreur = 'Impossible de charger le stock.'; }
    });
  }

  chargerMouvements(): void {
    this.pharmacie.mouvements(this.typeMouvement || undefined).subscribe({
      next: m => this.mouvements = m,
      error: () => this.erreur = 'Impossible de charger les mouvements.'
    });
  }

  filtres(): Medicament[] {
    const q = this.recherche.trim().toLowerCase();
    return this.medicaments.filter(m =>
      (!q || `${m.libelle} ${m.dci ?? ''} ${m.code}`.toLowerCase().includes(q)) &&
      (this.filtre === 'tous' || (this.filtre === 'alertes' && m.sousSeuil) || (this.filtre === 'rupture' && m.enRupture)));
  }

  etat(m: Medicament): { libelle: string; ton: string } {
    if (!m.actif) return { libelle: 'Désactivé', ton: 'tone-gray' };
    if (m.enRupture) return { libelle: 'Rupture', ton: 'tone-red' };
    if (m.sousSeuil) return { libelle: 'Stock bas', ton: 'tone-orange' };
    return { libelle: 'Disponible', ton: 'tone-green' };
  }

  lotsPerimes(): number {
    return this.medicaments.reduce((n, m) => n + (m.lots ?? []).filter(l => l.perime && l.quantiteRestante > 0).length, 0);
  }

  retirerPerimes(): void {
    this.pharmacie.retirerLotsPerimes().subscribe({
      next: r => { this.succes = `${r.lotsRetires} lot(s) périmé(s) retiré(s) du stock.`; this.charger(); },
      error: () => this.erreur = 'Le retrait des lots périmés a échoué.'
    });
  }

  ouvrirAjustement(l: Lot): void {
    this.lotAjuste = l;
    this.nouvelleQuantite = l.quantiteRestante;
    this.motif = '';
    this.erreurAjustement = '';
  }

  ajuster(): void {
    if (!this.lotAjuste || this.nouvelleQuantite === null) return;
    this.pharmacie.ajuster({ lotId: this.lotAjuste.id, nouvelleQuantite: this.nouvelleQuantite, motif: this.motif }).subscribe({
      next: l => { this.succes = `Lot ${l.numeroLot} ajusté à ${l.quantiteRestante} unité(s).`; this.lotAjuste = undefined; this.charger(); },
      error: (e: HttpErrorResponse) => this.erreurAjustement = e.error?.message ?? 'Ajustement impossible.'
    });
  }

  libelleMouvement(t: string): string {
    return ({ ENTREE: 'Entrée', SORTIE: 'Sortie', AJUSTEMENT: 'Ajustement', PEREMPTION: 'Péremption' } as Record<string, string>)[t] ?? t;
  }

  tonMouvement(t: string): string {
    return ({ ENTREE: 'tone-green', SORTIE: 'tone-blue', AJUSTEMENT: 'tone-violet', PEREMPTION: 'tone-red' } as Record<string, string>)[t] ?? 'tone-gray';
  }
}
