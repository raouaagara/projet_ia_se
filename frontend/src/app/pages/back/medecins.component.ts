import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { MedecinWidgetComponent } from '../../shared/medecin-widget.component';

@Component({
  selector: 'app-medecins',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, MedecinWidgetComponent],
  template: `
    <div class="page-header">
      <div class="page-header-info">
        <h2><i class="fa fa-user-doctor" style="color:var(--primary)"></i> Médecins</h2>
        <p>Équipe médicale de la clinique</p>
      </div>
      <button class="btn btn-primary" (click)="showForm = !showForm">
        <i class="fa fa-plus"></i> Nouveau médecin
      </button>
    </div>

    <!-- FORM -->
    <div class="card animate-fade-up" style="margin-bottom:20px" *ngIf="showForm">
      <div class="card-header">
        <div class="card-title">
          <i class="fa fa-user-doctor"></i>
          {{ editingId ? 'Modifier le médecin' : 'Nouveau médecin' }}
        </div>
        <button class="btn btn-ghost btn-sm" (click)="reset()"><i class="fa fa-xmark"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nom *</label>
            <input class="form-control" formControlName="nom" placeholder="Martin">
          </div>
          <div class="form-group">
            <label class="form-label">Prénom *</label>
            <input class="form-control" formControlName="prenom" placeholder="Sophie">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Spécialité *</label>
            <select class="form-control" formControlName="specialite">
              <option value="">— Choisir —</option>
              <option *ngFor="let s of specialites" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Téléphone</label>
            <input class="form-control" formControlName="telephone" placeholder="06 00 00 00 00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email <span style="color:#0f6cbd;font-size:11px">(= identifiant de connexion)</span></label>
            <input class="form-control" formControlName="email" type="email" placeholder="dr.martin&#64;clinique.fr">
          </div>
          <div class="form-group">
            <label class="form-label">Mot de passe <span style="color:#64748b;font-size:11px">(par défaut: password)</span></label>
            <input class="form-control" formControlName="motDePasse" type="password" placeholder="Laisser vide = password">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Faculté / École</label>
            <select class="form-control" formControlName="faculte">
              <option value="">— Choisir —</option>
              <option *ngFor="let f of facultes" [value]="f">{{ f }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Horaires</label>
            <select class="form-control" formControlName="horaires">
              <option value="">— Choisir —</option>
              <option *ngFor="let h of horairesOptions" [value]="h">{{ h }}</option>
            </select>
          </div>
        </div>
          <div class="form-row">
          <div class="form-group">
            <label class="form-label">Disponibilité</label>
            <select class="form-control" formControlName="disponible">
              <option [ngValue]="true">Disponible</option>
              <option [ngValue]="false">Indisponible</option>
            </select>
          </div>
        </div>
        <div *ngIf="saveError" style="color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 14px;font-size:13px;margin-bottom:4px">
          <i class="fa fa-triangle-exclamation"></i> {{ saveError }}
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-ghost" type="button" (click)="reset()">Annuler</button>
          <button class="btn btn-primary" type="submit">
            <i class="fa fa-floppy-disk"></i> Enregistrer
          </button>
        </div>
      </form>
    </div>

    <!-- CARDS GRID -->
    <div class="grid grid-auto" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))">
      <app-medecin-widget
        *ngFor="let m of items; let i = index"
        [medecin]="m"
        [style.animation-delay]="i * 0.05 + 's'"
        class="animate-fade-up"
      >
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-ghost btn-sm" style="flex:1" (click)="edit(m)">
            <i class="fa fa-pen"></i> Modifier
          </button>
          <button class="btn btn-danger btn-sm" (click)="remove(m.id)">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </app-medecin-widget>
      <div *ngIf="items.length === 0" class="card" style="grid-column:1/-1">
        <div class="empty-state">
          <i class="fa fa-user-doctor"></i>
          <p>Aucun médecin enregistré</p>
        </div>
      </div>
    </div>
  `
})
export class MedecinsComponent implements OnInit {
  items: any[] = [];
  editingId?: number;
  showForm = false;
  saveError = '';

  specialites = [
    'Médecine Générale','Cardiologie','Neurologie','Orthopédie',
    'Ophtalmologie','Pédiatrie','Chirurgie','Dermatologie',
    'Gynécologie','Rhumatologie','Gastro-entérologie','Endocrinologie',
    'Pneumologie','Urologie','Oncologie','Psychiatrie',
    'Anesthésiologie','Radiologie','Médecine d\'urgence','Néphrologie'
  ];

  facultes = [
    'Faculté de Médecine d\'Alger','Faculté de Médecine de Constantine',
    'Faculté de Médecine d\'Oran','Faculté de Médecine de Annaba',
    'Faculté de Médecine de Tlemcen','Faculté de Médecine de Sétif',
    'Faculté de Médecine de Blida','Faculté de Médecine de Tizi Ouzou',
    'Université Paris Descartes','Université de Lyon','Université de Montpellier','Autre'
  ];

  horairesOptions = [
    'Lun-Ven 8h-12h','Lun-Ven 14h-18h','Lun-Ven 8h-17h','Lun-Ven 9h-17h',
    'Lun-Sam 8h-12h','Lun-Sam 9h-17h','Sam 9h-13h','Sur rendez-vous uniquement'
  ];

  form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    specialite: ['', Validators.required],
    telephone: [''],
    email: [''],
    motDePasse: [''],
    horaires: [''],
    faculte: [''],
    disponible: [true]
  });

  constructor(private fb: FormBuilder, private api: ApiService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.api.medecins().subscribe((d) => this.items = d); }
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Veuillez remplir tous les champs obligatoires (*)';
      return;
    }
    this.saveError = '';
    this.api.saveMedecin(this.form.getRawValue(), this.editingId).subscribe({
      next: () => { this.reset(); this.load(); },
      error: (err) => {
        this.saveError = err?.error?.message || `Erreur lors de l'enregistrement (code ${err?.status})`;
      }
    });
  }
  edit(m: any): void { this.editingId = m.id; this.showForm = true; this.saveError = ''; this.form.patchValue(m); }
  reset(): void { this.editingId = undefined; this.showForm = false; this.saveError = ''; this.form.reset({ disponible: true }); }
  remove(id: number): void { if (confirm('Supprimer ce médecin ?')) this.api.deleteMedecin(id).subscribe(() => this.load()); }
}
