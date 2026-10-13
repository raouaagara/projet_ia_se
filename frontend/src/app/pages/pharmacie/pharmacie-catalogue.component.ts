import { MontantPipe } from '../../shared/montant.pipe';
import { Component, OnInit } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Fournisseur, Medicament, PharmacieService } from '../../core/pharmacie.service';

@Component({
  selector: 'app-pharmacie-catalogue',
  standalone: true,
  imports: [MontantPipe, NgIf, NgFor, NgClass, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-capsules"></i> Catalogue</h1>
          <p class="mc-sub">Médicaments référencés par la pharmacie et fournisseurs</p>
        </div>
        <div class="mc-tabs">
          <button class="mc-tab" [class.active]="onglet === 'medicaments'" (click)="onglet = 'medicaments'">Médicaments ({{ medicaments.length }})</button>
          <button class="mc-tab" [class.active]="onglet === 'fournisseurs'" (click)="onglet = 'fournisseurs'">Fournisseurs ({{ fournisseurs.length }})</button>
        </div>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
      <div class="mc-alert mc-alert-success" *ngIf="succes"><i class="fa fa-circle-check"></i> {{ succes }}</div>

      <section class="mc-panel" *ngIf="onglet === 'medicaments'">
        <div class="mc-panel-head">
          <div class="mc-search"><i class="fa fa-magnifying-glass"></i>
            <input [(ngModel)]="recherche" placeholder="Nom, DCI ou code" aria-label="Rechercher un médicament">
          </div>
          <button class="mc-btn mc-btn-primary" (click)="editerMedicament()"><i class="fa fa-plus"></i> Nouveau médicament</button>
        </div>
        <div class="mc-scroll">
          <table class="mc-table">
            <thead><tr><th>Code</th><th>Médicament</th><th>DCI</th><th class="mc-num">Prix</th><th class="mc-num">Seuil</th><th class="mc-num">Stock</th><th>Délivrance</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let m of medicamentsFiltres()">
                <td class="mc-muted">{{ m.code }}</td>
                <td class="mc-strong">{{ m.libelle }}</td>
                <td>{{ m.dci || '—' }}</td>
                <td class="mc-num">{{ m.prixUnitaire | montant }}</td>
                <td class="mc-num">{{ m.seuilAlerte }}</td>
                <td class="mc-num">{{ m.stockDisponible }}</td>
                <td>{{ m.surOrdonnance ? 'Sur ordonnance' : 'Libre' }}</td>
                <td><span class="mc-chip" [ngClass]="m.actif ? 'tone-green' : 'tone-gray'">{{ m.actif ? 'Actif' : 'Désactivé' }}</span></td>
                <td class="mc-num">
                  <button class="mc-btn mc-btn-sm" (click)="editerMedicament(m)" title="Modifier"><i class="fa fa-pen"></i></button>
                  <button class="mc-btn mc-btn-sm mc-btn-danger" (click)="aSupprimer = { type: 'medicament', id: m.id!, nom: m.libelle! }" title="Supprimer"><i class="fa fa-trash-can"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mc-panel" *ngIf="onglet === 'fournisseurs'">
        <div class="mc-panel-head">
          <div class="mc-panel-title"><i class="fa fa-truck"></i> Fournisseurs</div>
          <button class="mc-btn mc-btn-primary" (click)="editerFournisseur()"><i class="fa fa-plus"></i> Nouveau fournisseur</button>
        </div>
        <div class="mc-empty" *ngIf="fournisseurs.length === 0"><i class="fa fa-inbox"></i>Aucun fournisseur.</div>
        <div class="mc-scroll" *ngIf="fournisseurs.length > 0">
          <table class="mc-table">
            <thead><tr><th>Nom</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let f of fournisseurs">
                <td class="mc-strong">{{ f.nom }}</td><td>{{ f.telephone || '—' }}</td><td>{{ f.email || '—' }}</td><td>{{ f.adresse || '—' }}</td>
                <td><span class="mc-chip" [ngClass]="f.actif ? 'tone-green' : 'tone-gray'">{{ f.actif ? 'Actif' : 'Inactif' }}</span></td>
                <td class="mc-num">
                  <button class="mc-btn mc-btn-sm" (click)="editerFournisseur(f)" title="Modifier"><i class="fa fa-pen"></i></button>
                  <button class="mc-btn mc-btn-sm mc-btn-danger" (click)="aSupprimer = { type: 'fournisseur', id: f.id!, nom: f.nom }" title="Supprimer"><i class="fa fa-trash-can"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Formulaire médicament -->
    <div class="mc-overlay" *ngIf="formMedicamentOuvert" (click)="formMedicamentOuvert = false">
      <form class="mc-modal" [formGroup]="formMedicament" (ngSubmit)="enregistrerMedicament()" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="mc-modal-head">
          <div class="mc-modal-title"><i class="fa fa-capsules"></i> {{ formMedicament.value.id ? 'Modifier le médicament' : 'Nouveau médicament' }}</div>
          <button type="button" class="mc-close" (click)="formMedicamentOuvert = false" aria-label="Fermer"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="mc-modal-body">
          <div class="mc-form">
            <div class="mc-field"><label for="m-code">Code <span class="req">*</span></label><input id="m-code" formControlName="code" placeholder="Ex. PARA1000"></div>
            <div class="mc-field"><label for="m-nom">Nom commercial <span class="req">*</span></label><input id="m-nom" formControlName="nomCommercial"></div>
            <div class="mc-field"><label for="m-dci">DCI (molécule)</label><input id="m-dci" formControlName="dci"></div>
            <div class="mc-field"><label for="m-forme">Forme</label><input id="m-forme" formControlName="forme" placeholder="comprimé, gélule, sirop…"></div>
            <div class="mc-field"><label for="m-dos">Dosage</label><input id="m-dos" formControlName="dosage" placeholder="Ex. 500 mg"></div>
            <div class="mc-field"><label for="m-px">Prix unitaire (DT) <span class="req">*</span></label><input id="m-px" type="number" min="0" step="0.001" formControlName="prixUnitaire"></div>
            <div class="mc-field"><label for="m-seuil">Seuil d'alerte <span class="req">*</span></label><input id="m-seuil" type="number" min="0" formControlName="seuilAlerte">
              <span class="mc-field-hint">Une alerte est émise sous ce nombre d'unités.</span></div>
          </div>
          <label class="mc-check"><input type="checkbox" formControlName="surOrdonnance"> Délivrance sur ordonnance uniquement</label>
          <label class="mc-check"><input type="checkbox" formControlName="actif"> Référencé (disponible à la prescription)</label>
          <div class="mc-alert mc-alert-error" *ngIf="erreurForm"><i class="fa fa-circle-exclamation"></i> {{ erreurForm }}</div>
        </div>
        <div class="mc-modal-foot">
          <button type="button" class="mc-btn" (click)="formMedicamentOuvert = false">Annuler</button>
          <button type="submit" class="mc-btn mc-btn-primary" [disabled]="formMedicament.invalid">Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- Formulaire fournisseur -->
    <div class="mc-overlay" *ngIf="formFournisseurOuvert" (click)="formFournisseurOuvert = false">
      <form class="mc-modal" [formGroup]="formFournisseur" (ngSubmit)="enregistrerFournisseur()" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="mc-modal-head">
          <div class="mc-modal-title"><i class="fa fa-truck"></i> {{ formFournisseur.value.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}</div>
          <button type="button" class="mc-close" (click)="formFournisseurOuvert = false" aria-label="Fermer"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="mc-modal-body">
          <div class="mc-form">
            <div class="mc-field mc-field-wide"><label for="f-nom">Nom <span class="req">*</span></label><input id="f-nom" formControlName="nom"></div>
            <div class="mc-field"><label for="f-tel">Téléphone</label><input id="f-tel" formControlName="telephone"></div>
            <div class="mc-field"><label for="f-mail">Email</label><input id="f-mail" type="email" formControlName="email"></div>
            <div class="mc-field mc-field-wide"><label for="f-adr">Adresse</label><input id="f-adr" formControlName="adresse"></div>
          </div>
          <label class="mc-check"><input type="checkbox" formControlName="actif"> Fournisseur actif</label>
          <div class="mc-alert mc-alert-error" *ngIf="erreurForm"><i class="fa fa-circle-exclamation"></i> {{ erreurForm }}</div>
        </div>
        <div class="mc-modal-foot">
          <button type="button" class="mc-btn" (click)="formFournisseurOuvert = false">Annuler</button>
          <button type="submit" class="mc-btn mc-btn-primary" [disabled]="formFournisseur.invalid">Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- Confirmation de suppression -->
    <div class="mc-overlay" *ngIf="aSupprimer" (click)="aSupprimer = undefined">
      <div class="mc-modal" (click)="$event.stopPropagation()" role="alertdialog" aria-modal="true">
        <div class="mc-modal-head"><div class="mc-modal-title"><i class="fa fa-triangle-exclamation"></i> Confirmer la suppression</div></div>
        <div class="mc-modal-body">
          <p>Supprimer <strong>{{ aSupprimer.nom }}</strong> ?</p>
          <p class="mc-muted">S'il a déjà été utilisé (lots, ordonnances), il sera désactivé pour conserver l'historique.</p>
        </div>
        <div class="mc-modal-foot">
          <button class="mc-btn" (click)="aSupprimer = undefined">Annuler</button>
          <button class="mc-btn mc-btn-danger" (click)="supprimer()"><i class="fa fa-trash-can"></i> Supprimer</button>
        </div>
      </div>
    </div>
  `
})
export class PharmacieCatalogueComponent implements OnInit {
  onglet: 'medicaments' | 'fournisseurs' = 'medicaments';
  medicaments: Medicament[] = [];
  fournisseurs: Fournisseur[] = [];
  recherche = '';
  erreur = '';
  succes = '';
  erreurForm = '';
  formMedicamentOuvert = false;
  formFournisseurOuvert = false;
  aSupprimer?: { type: 'medicament' | 'fournisseur'; id: number; nom: string };

  formMedicament = this.fb.group({
    id: [null as number | null],
    code: ['', [Validators.required, Validators.maxLength(30)]],
    nomCommercial: ['', [Validators.required, Validators.maxLength(120)]],
    dci: [''], forme: [''], dosage: [''],
    prixUnitaire: [null as number | null, [Validators.required, Validators.min(0)]],
    seuilAlerte: [10, [Validators.required, Validators.min(0)]],
    surOrdonnance: [true], actif: [true]
  });

  formFournisseur = this.fb.group({
    id: [null as number | null],
    nom: ['', [Validators.required, Validators.maxLength(120)]],
    telephone: [''], email: ['', Validators.email], adresse: [''], actif: [true]
  });

  constructor(private fb: FormBuilder, private pharmacie: PharmacieService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.pharmacie.medicaments().subscribe({ next: m => this.medicaments = m, error: () => this.erreur = 'Impossible de charger le catalogue.' });
    this.pharmacie.fournisseurs().subscribe({ next: f => this.fournisseurs = f, error: () => {} });
  }

  medicamentsFiltres(): Medicament[] {
    const q = this.recherche.trim().toLowerCase();
    return q ? this.medicaments.filter(m => `${m.libelle} ${m.dci ?? ''} ${m.code}`.toLowerCase().includes(q)) : this.medicaments;
  }

  editerMedicament(m?: Medicament): void {
    this.erreurForm = '';
    this.formMedicament.reset(m ? { ...m, id: m.id ?? null } as any : { id: null, code: '', nomCommercial: '', dci: '', forme: '', dosage: '', prixUnitaire: null, seuilAlerte: 10, surOrdonnance: true, actif: true });
    this.formMedicamentOuvert = true;
  }

  enregistrerMedicament(): void {
    const v = this.formMedicament.getRawValue();
    this.pharmacie.enregistrerMedicament({ ...v, id: v.id ?? undefined } as Medicament).subscribe({
      next: m => { this.formMedicamentOuvert = false; this.succes = `${m.libelle} enregistré.`; this.charger(); },
      error: (e: HttpErrorResponse) => this.erreurForm = e.error?.message ?? 'Enregistrement impossible.'
    });
  }

  editerFournisseur(f?: Fournisseur): void {
    this.erreurForm = '';
    this.formFournisseur.reset(f ? { ...f, id: f.id ?? null } as any : { id: null, nom: '', telephone: '', email: '', adresse: '', actif: true });
    this.formFournisseurOuvert = true;
  }

  enregistrerFournisseur(): void {
    const v = this.formFournisseur.getRawValue();
    this.pharmacie.enregistrerFournisseur({ ...v, id: v.id ?? undefined, email: v.email || undefined } as Fournisseur).subscribe({
      next: f => { this.formFournisseurOuvert = false; this.succes = `Fournisseur ${f.nom} enregistré.`; this.charger(); },
      error: (e: HttpErrorResponse) => this.erreurForm = e.error?.message ?? 'Enregistrement impossible.'
    });
  }

  supprimer(): void {
    const cible = this.aSupprimer;
    if (!cible) return;
    const requete = cible.type === 'medicament' ? this.pharmacie.supprimerMedicament(cible.id) : this.pharmacie.supprimerFournisseur(cible.id);
    requete.subscribe({
      next: () => { this.aSupprimer = undefined; this.succes = `${cible.nom} supprimé (ou désactivé s'il était utilisé).`; this.charger(); },
      error: (e: HttpErrorResponse) => { this.aSupprimer = undefined; this.erreur = e.error?.message ?? 'Suppression impossible.'; }
    });
  }
}
