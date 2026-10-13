import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Medicament, Ordonnance, PharmacieService } from '../../core/pharmacie.service';

@Component({
  selector: 'app-ordonnances',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, NgClass, DatePipe],
  template: `
    <div class="mc-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-file-prescription"></i> Ordonnances</h1>
          <p class="mc-sub">Prescriptions structurées à partir du catalogue de la pharmacie : elles sont délivrées et facturées directement par la pharmacie.</p>
        </div>
        <button class="mc-btn mc-btn-primary" (click)="nouvelle()" *ngIf="!formOuvert"><i class="fa fa-plus"></i> Nouvelle ordonnance</button>
      </div>

      <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
      <div class="mc-alert mc-alert-success" *ngIf="succes"><i class="fa fa-circle-check"></i> {{ succes }}</div>

      <section class="mc-panel" *ngIf="formOuvert">
        <div class="mc-panel-head">
          <div class="mc-panel-title"><i class="fa fa-pen-to-square"></i> {{ editionId ? 'Modifier l\\'ordonnance n° ' + editionId : 'Nouvelle ordonnance' }}</div>
          <button class="mc-close" (click)="fermer()" aria-label="Fermer"><i class="fa fa-xmark"></i></button>
        </div>
        <form class="mc-panel-body od-form" [formGroup]="form" (ngSubmit)="enregistrer()">
          <div class="mc-form">
            <div class="mc-field mc-field-wide"><label for="od-cons">Consultation <span class="req">*</span></label>
              <select id="od-cons" formControlName="consultationId">
                <option [ngValue]="null" disabled>Choisir la consultation</option>
                <option *ngFor="let c of consultations" [ngValue]="c.id">{{ c.dateConsultation | date:'dd/MM/yyyy' }} — {{ c.patientNom }}{{ c.diagnostic ? ' — ' + c.diagnostic : '' }}</option>
              </select>
              <span class="mc-field-hint" *ngIf="consultations.length === 0">Aucune consultation : enregistrez d'abord la consultation du patient.</span>
            </div>
          </div>

          <div class="od-lignes" formArrayName="lignes">
            <div class="od-ligne" *ngFor="let l of lignes.controls; let i = index" [formGroupName]="i">
              <div class="mc-field od-med"><label [for]="'od-m' + i">Médicament <span class="req">*</span></label>
                <select [id]="'od-m' + i" formControlName="medicamentId">
                  <option [ngValue]="null" disabled>Choisir dans le catalogue</option>
                  <option *ngFor="let m of medicaments" [ngValue]="m.id">{{ m.libelle }} — {{ m.enRupture ? 'rupture de stock' : 'stock : ' + m.stockDisponible }}</option>
                </select>
                <span class="mc-field-hint od-warn" *ngIf="stockDe(l.value.medicamentId) === 0">Ce médicament est en rupture : la pharmacie ne pourra pas le délivrer immédiatement.</span>
              </div>
              <div class="mc-field od-poso"><label [for]="'od-p' + i">Posologie</label>
                <input [id]="'od-p' + i" formControlName="posologie" placeholder="Ex. 1 comprimé matin et soir"></div>
              <div class="mc-field od-small"><label [for]="'od-d' + i">Durée (jours)</label>
                <input [id]="'od-d' + i" type="number" min="1" formControlName="dureeJours"></div>
              <div class="mc-field od-small"><label [for]="'od-q' + i">Quantité <span class="req">*</span></label>
                <input [id]="'od-q' + i" type="number" min="1" formControlName="quantite"></div>
              <button type="button" class="mc-btn mc-btn-sm mc-btn-danger od-del" (click)="lignes.removeAt(i)" [disabled]="lignes.length === 1" title="Retirer ce médicament" aria-label="Retirer ce médicament"><i class="fa fa-trash-can"></i></button>
            </div>
            <button type="button" class="mc-btn mc-btn-sm" (click)="ajouterLigne()"><i class="fa fa-plus"></i> Ajouter un médicament</button>
          </div>

          <div class="mc-field"><label for="od-ins">Instructions au patient</label>
            <textarea id="od-ins" formControlName="instructions" rows="3" placeholder="Ex. À prendre au cours des repas. Reconsulter si les symptômes persistent."></textarea></div>

          <div class="mc-actions">
            <button type="button" class="mc-btn" (click)="fermer()">Annuler</button>
            <button type="submit" class="mc-btn mc-btn-primary" [disabled]="form.invalid || envoi"><i class="fa fa-check"></i> {{ editionId ? 'Enregistrer les modifications' : 'Créer l\\'ordonnance' }}</button>
          </div>
        </form>
      </section>

      <section class="mc-panel">
        <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-list"></i> {{ estMedecin ? 'Mes ordonnances' : 'Toutes les ordonnances' }} ({{ ordonnances.length }})</div></div>
        <div class="mc-loading" *ngIf="chargement"><i class="fa fa-spinner fa-spin"></i> Chargement…</div>
        <div class="mc-empty" *ngIf="!chargement && ordonnances.length === 0"><i class="fa fa-file-prescription"></i>Aucune ordonnance pour le moment.</div>
        <div class="mc-scroll" *ngIf="ordonnances.length">
          <table class="mc-table">
            <thead><tr><th>N°</th><th>Date</th><th>Patient</th><th>Médicaments</th><th>Pharmacie</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let o of ordonnances">
                <td class="mc-muted">{{ o.id }}</td>
                <td>{{ o.dateEmission | date:'dd/MM/yyyy' }}</td>
                <td><span class="mc-strong">{{ o.patientNom }}</span><br><span class="mc-muted">{{ o.numeroDossier }}</span></td>
                <td class="od-meds">
                  <ng-container *ngIf="o.lignes.length; else texte">
                    <div *ngFor="let l of o.lignes">{{ l.medicamentNom }} <span class="mc-muted">× {{ l.quantite }}{{ l.posologie ? ' — ' + l.posologie : '' }}</span></div>
                  </ng-container>
                  <ng-template #texte><span class="mc-muted">{{ o.medicaments }}</span></ng-template>
                </td>
                <td><span class="mc-chip" [ngClass]="statut(o).ton">{{ statut(o).libelle }}</span></td>
                <td class="mc-num">
                  <button class="mc-btn mc-btn-sm" (click)="imprimer(o)" title="Imprimer"><i class="fa fa-print"></i></button>
                  <ng-container *ngIf="modifiable(o)">
                    <button class="mc-btn mc-btn-sm" (click)="editer(o)" title="Modifier"><i class="fa fa-pen"></i></button>
                    <button class="mc-btn mc-btn-sm mc-btn-danger" (click)="aSupprimer = o" title="Supprimer"><i class="fa fa-trash-can"></i></button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="mc-overlay" *ngIf="aSupprimer" (click)="aSupprimer = undefined">
      <div class="mc-modal" (click)="$event.stopPropagation()" role="alertdialog" aria-modal="true">
        <div class="mc-modal-head"><div class="mc-modal-title"><i class="fa fa-triangle-exclamation"></i> Supprimer l'ordonnance n° {{ aSupprimer.id }} ?</div></div>
        <div class="mc-modal-body"><p>Cette ordonnance de {{ aSupprimer.patientNom }} sera définitivement supprimée.</p></div>
        <div class="mc-modal-foot">
          <button class="mc-btn" (click)="aSupprimer = undefined">Annuler</button>
          <button class="mc-btn mc-btn-danger" (click)="supprimer()"><i class="fa fa-trash-can"></i> Supprimer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .od-form { display:flex; flex-direction:column; gap:16px; }
    .od-lignes { display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
    .od-ligne { width:100%; display:grid; grid-template-columns: minmax(220px,2fr) minmax(180px,2fr) 110px 110px auto; gap:10px; align-items:end;
      padding:12px; border:1.5px solid var(--border); border-radius:12px; background:var(--bg); }
    .od-del { margin-bottom:4px; }
    .od-warn { color:#b45309; }
    .od-meds div { line-height:1.5; }
    @media (max-width: 900px) { .od-ligne { grid-template-columns: 1fr 1fr; } .od-med, .od-poso { grid-column: 1 / -1; } }
  `]
})
export class OrdonnancesComponent implements OnInit {
  ordonnances: Ordonnance[] = [];
  consultations: any[] = [];
  medicaments: Medicament[] = [];
  estMedecin = false;
  formOuvert = false;
  editionId?: number;
  aSupprimer?: Ordonnance;
  chargement = true;
  envoi = false;
  erreur = '';
  succes = '';

  form = this.fb.group({
    consultationId: [null as number | null, Validators.required],
    instructions: [''],
    lignes: this.fb.array([this.nouvelleLigne()])
  });

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private pharmacie: PharmacieService) {}

  get lignes(): FormArray { return this.form.get('lignes') as FormArray; }

  ngOnInit(): void {
    this.estMedecin = this.auth.role() === 'MEDECIN';
    this.pharmacie.medicaments().subscribe({ next: m => this.medicaments = m.filter(x => x.actif), error: () => {} });
    if (this.estMedecin) {
      const uid = this.auth.current()?.id;
      if (uid) {
        this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
          if (m) this.api.consultationsMedecin(m.id).subscribe(c => this.consultations = c);
        });
      }
    } else {
      this.api.consultations().subscribe(c => this.consultations = c);
    }
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.api.ordonnances().subscribe({
      next: o => { this.ordonnances = o as Ordonnance[]; this.chargement = false; },
      error: () => { this.chargement = false; this.erreur = 'Impossible de charger les ordonnances.'; }
    });
  }

  nouvelleLigne(l?: { medicamentId: number; posologie?: string; dureeJours?: number; quantite: number }) {
    return this.fb.group({
      medicamentId: [l?.medicamentId ?? null as number | null, Validators.required],
      posologie: [l?.posologie ?? ''],
      dureeJours: [l?.dureeJours ?? null as number | null, Validators.min(1)],
      quantite: [l?.quantite ?? 1, [Validators.required, Validators.min(1)]]
    });
  }

  ajouterLigne(): void { this.lignes.push(this.nouvelleLigne()); }

  stockDe(id: number | null): number | undefined {
    return id == null ? undefined : this.medicaments.find(m => m.id === id)?.stockDisponible;
  }

  nouvelle(): void {
    this.editionId = undefined;
    this.lignes.clear();
    this.lignes.push(this.nouvelleLigne());
    this.form.reset({ consultationId: null, instructions: '' });
    this.formOuvert = true;
    this.succes = '';
  }

  editer(o: Ordonnance): void {
    this.editionId = o.id;
    this.lignes.clear();
    (o.lignes.length ? o.lignes : [undefined]).forEach(l => this.lignes.push(this.nouvelleLigne(l as any)));
    this.form.patchValue({ consultationId: o.consultationId, instructions: o.instructions ?? '' });
    this.formOuvert = true;
    this.succes = '';
  }

  fermer(): void { this.formOuvert = false; this.editionId = undefined; }

  enregistrer(): void {
    if (this.form.invalid) return;
    this.envoi = true;
    this.erreur = '';
    const v = this.form.getRawValue();
    const corps = { consultationId: v.consultationId, instructions: v.instructions, lignes: v.lignes };
    this.api.saveOrdonnance(corps, this.editionId).subscribe({
      next: (o: any) => {
        this.envoi = false;
        this.succes = this.editionId ? `Ordonnance n° ${o.id} modifiée.` : `Ordonnance n° ${o.id} créée : le patient a été notifié et la pharmacie peut la délivrer.`;
        this.fermer();
        this.charger();
      },
      error: (e: HttpErrorResponse) => { this.envoi = false; this.erreur = e.error?.message ?? 'Enregistrement impossible.'; }
    });
  }

  supprimer(): void {
    const o = this.aSupprimer;
    if (!o?.id) return;
    this.api.deleteOrdonnance(o.id).subscribe({
      next: () => { this.aSupprimer = undefined; this.succes = `Ordonnance n° ${o.id} supprimée.`; this.charger(); },
      error: (e: HttpErrorResponse) => { this.aSupprimer = undefined; this.erreur = e.error?.message ?? 'Suppression impossible.'; }
    });
  }

  modifiable(o: Ordonnance): boolean {
    return o.statutDelivrance !== 'PARTIELLE' && o.statutDelivrance !== 'COMPLETE';
  }

  statut(o: Ordonnance): { libelle: string; ton: string } {
    switch (o.statutDelivrance) {
      case 'COMPLETE': return { libelle: 'Délivrée', ton: 'tone-green' };
      case 'PARTIELLE': return { libelle: 'Partiellement délivrée', ton: 'tone-orange' };
      case 'NON_DELIVREE': return { libelle: 'À délivrer', ton: 'tone-teal' };
      default: return { libelle: 'Texte libre', ton: 'tone-gray' };
    }
  }

  imprimer(o: Ordonnance): void {
    const e = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
    const lignes = o.lignes.length
      ? o.lignes.map(l => `<li><strong>${e(l.medicamentNom)}</strong> — ${e(l.posologie || '')}${l.dureeJours ? ' pendant ' + l.dureeJours + ' jour(s)' : ''} — quantité : ${l.quantite}</li>`).join('')
      : `<li>${e(o.medicaments).replace(/\n/g, '<br>')}</li>`;
    const w = window.open('', '_blank', 'width=720,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Ordonnance n° ${o.id}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin:0}li{margin:10px 0;font-size:14px}.muted{color:#64748b;font-size:13px}</style></head><body>
      <h1>MediCare — Ordonnance n° ${o.id}</h1>
      <p class="muted">${e(o.medecinNom)} · ${new Date(o.dateEmission ?? '').toLocaleDateString('fr-FR')}</p>
      <p><strong>Patient :</strong> ${e(o.patientNom)} (${e(o.numeroDossier)})</p>
      <ol>${lignes}</ol>
      ${o.instructions ? `<p><strong>Instructions :</strong> ${e(o.instructions)}</p>` : ''}
      <p class="muted" style="margin-top:48px">Signature du médecin</p></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }
}
