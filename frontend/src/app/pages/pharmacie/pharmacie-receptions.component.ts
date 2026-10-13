import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Fournisseur, Medicament, Mouvement, PharmacieService } from '../../core/pharmacie.service';

@Component({
  selector: 'app-pharmacie-receptions',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, DatePipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-truck-ramp-box"></i> Réceptions</h1>
          <p class="mc-sub">Enregistrez chaque lot livré : il entre immédiatement dans le stock disponible</p>
        </div>
      </div>

      <div class="mc-grid-2">
        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-plus"></i> Nouveau lot</div></div>
          <form class="mc-panel-body" [formGroup]="form" (ngSubmit)="enregistrer()">
            <div class="mc-form">
              <div class="mc-field mc-field-wide"><label for="r-med">Médicament <span class="req">*</span></label>
                <select id="r-med" formControlName="medicamentId">
                  <option [ngValue]="null" disabled>Choisir un médicament</option>
                  <option *ngFor="let m of medicaments" [ngValue]="m.id">{{ m.libelle }} — {{ m.code }}</option>
                </select></div>
              <div class="mc-field mc-field-wide"><label for="r-fou">Fournisseur</label>
                <select id="r-fou" formControlName="fournisseurId">
                  <option [ngValue]="null">Non renseigné</option>
                  <option *ngFor="let f of fournisseurs" [ngValue]="f.id">{{ f.nom }}</option>
                </select></div>
              <div class="mc-field"><label for="r-lot">N° de lot <span class="req">*</span></label>
                <input id="r-lot" formControlName="numeroLot" placeholder="Ex. PA25-014"></div>
              <div class="mc-field"><label for="r-q">Quantité reçue <span class="req">*</span></label>
                <input id="r-q" type="number" min="1" formControlName="quantite"></div>
              <div class="mc-field"><label for="r-per">Date de péremption <span class="req">*</span></label>
                <input id="r-per" type="date" [min]="demain" formControlName="datePeremption"></div>
              <div class="mc-field"><label for="r-px">Prix d'achat unitaire (DT)</label>
                <input id="r-px" type="number" min="0" step="0.01" formControlName="prixAchat"></div>
            </div>
            <div class="mc-alert mc-alert-error" *ngIf="erreur" style="margin-top:14px"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
            <div class="mc-alert mc-alert-success" *ngIf="succes" style="margin-top:14px"><i class="fa fa-circle-check"></i> {{ succes }}</div>
            <div class="mc-actions" style="margin-top:16px">
              <button type="button" class="mc-btn" (click)="reinitialiser()">Effacer</button>
              <button type="submit" class="mc-btn mc-btn-primary" [disabled]="form.invalid || envoi"><i class="fa fa-check"></i> Enregistrer la réception</button>
            </div>
          </form>
        </section>

        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-clock-rotate-left"></i> Dernières réceptions</div></div>
          <div class="mc-empty" *ngIf="receptions.length === 0"><i class="fa fa-inbox"></i>Aucune réception enregistrée.</div>
          <div class="mc-list">
            <div class="mc-list-item" *ngFor="let r of receptions.slice(0, 12)">
              <span class="mc-chip tone-green">+{{ r.quantite }}</span>
              <div>
                <div class="mc-strong">{{ r.medicamentNom }} · lot {{ r.numeroLot }}</div>
                <div class="mc-muted">{{ r.dateMouvement | date:'dd/MM/yyyy HH:mm' }} · {{ r.motif }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
})
export class PharmacieReceptionsComponent implements OnInit {
  medicaments: Medicament[] = [];
  fournisseurs: Fournisseur[] = [];
  receptions: Mouvement[] = [];
  erreur = '';
  succes = '';
  envoi = false;
  readonly demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  form = this.fb.group({
    medicamentId: [null as number | null, Validators.required],
    fournisseurId: [null as number | null],
    numeroLot: ['', [Validators.required, Validators.maxLength(40)]],
    quantite: [null as number | null, [Validators.required, Validators.min(1)]],
    datePeremption: ['', Validators.required],
    prixAchat: [null as number | null, Validators.min(0)]
  });

  constructor(private fb: FormBuilder, private pharmacie: PharmacieService) {}

  ngOnInit(): void {
    this.pharmacie.medicaments().subscribe(m => this.medicaments = m.filter(x => x.actif));
    this.pharmacie.fournisseurs().subscribe(f => this.fournisseurs = f.filter(x => x.actif));
    this.chargerReceptions();
  }

  chargerReceptions(): void {
    this.pharmacie.mouvements('ENTREE').subscribe(r => this.receptions = r);
  }

  enregistrer(): void {
    if (this.form.invalid) return;
    this.envoi = true;
    this.erreur = '';
    this.succes = '';
    const v = this.form.getRawValue();
    this.pharmacie.receptionner({
      medicamentId: v.medicamentId!, fournisseurId: v.fournisseurId, numeroLot: v.numeroLot!,
      quantite: v.quantite!, datePeremption: v.datePeremption!, prixAchat: v.prixAchat
    }).subscribe({
      next: lot => {
        this.envoi = false;
        this.succes = `Lot ${lot.numeroLot} enregistré : ${lot.quantiteInitiale} unité(s) de ${lot.medicamentNom}.`;
        this.form.reset({ medicamentId: null, fournisseurId: v.fournisseurId, numeroLot: '', quantite: null, datePeremption: '', prixAchat: null });
        this.chargerReceptions();
      },
      error: (e: HttpErrorResponse) => { this.envoi = false; this.erreur = e.error?.message ?? 'La réception n\'a pas pu être enregistrée.'; }
    });
  }

  reinitialiser(): void {
    this.form.reset({ medicamentId: null, fournisseurId: null, numeroLot: '', quantite: null, datePeremption: '', prixAchat: null });
    this.erreur = '';
    this.succes = '';
  }
}
