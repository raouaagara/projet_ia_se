import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  template: `
    <div class="page-header">
      <div class="page-header-info">
        <h2><i class="fa fa-users" style="color:var(--primary)"></i> Patients</h2>
        <p *ngIf="isMedecin">Vos patients (issus de vos rendez-vous)</p>
        <p *ngIf="!isMedecin">Gestion des dossiers patients ({{ items.length }} patient{{ items.length > 1 ? 's' : '' }})</p>
      </div>
      <button class="btn btn-primary" *ngIf="!isMedecin" (click)="showForm = !showForm">
        <i class="fa fa-plus"></i> Nouveau patient
      </button>
    </div>

    <!-- FORM (admin/secrétaire uniquement) -->
    <div class="card animate-fade-up" style="margin-bottom:20px" *ngIf="showForm && !isMedecin">
      <div class="card-header">
        <div class="card-title">
          <i class="fa fa-user-plus"></i>
          {{ editingId ? 'Modifier le patient' : 'Nouveau patient' }}
        </div>
        <button class="btn btn-ghost btn-sm" (click)="reset()"><i class="fa fa-xmark"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nom *</label>
            <input class="form-control" formControlName="nom" placeholder="Dupont">
          </div>
          <div class="form-group">
            <label class="form-label">Prénom *</label>
            <input class="form-control" formControlName="prenom" placeholder="Jean">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date de naissance</label>
            <input class="form-control" type="date" formControlName="dateNaissance">
          </div>
          <div class="form-group">
            <label class="form-label">Sexe</label>
            <select class="form-control" formControlName="sexe">
              <option value="F">Féminin</option>
              <option value="M">Masculin</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Téléphone</label>
            <input class="form-control" formControlName="telephone" placeholder="06 00 00 00 00">
          </div>
          <div class="form-group">
            <label class="form-label">Groupe sanguin</label>
            <input class="form-control" formControlName="groupeSanguin" placeholder="A+">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Adresse</label>
          <input class="form-control" formControlName="adresse" placeholder="Rue, ville">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Allergies</label>
            <input class="form-control" formControlName="allergies" placeholder="Aucune">
          </div>
          <div class="form-group">
            <label class="form-label">Antécédents</label>
            <input class="form-control" formControlName="antecedents" placeholder="Aucun">
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-ghost" type="button" (click)="reset()">Annuler</button>
          <button class="btn btn-primary" type="submit">
            <i class="fa fa-floppy-disk"></i> Enregistrer
          </button>
        </div>
      </form>
    </div>

    <!-- TABLE -->
    <div class="card animate-fade-up" style="animation-delay:0.1s">
      <div class="card-header">
        <div class="card-title"><i class="fa fa-list"></i> Liste des patients ({{ items.length }})</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dossier</th>
              <th>Patient</th>
              <th>Date naiss.</th>
              <th>Téléphone</th>
              <th>Groupe</th>
              <th *ngIf="!isMedecin" style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of items">
              <td><span class="badge badge-blue">{{ p.numeroDossier }}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar avatar-sm">{{ p.prenom?.charAt(0) }}{{ p.nom?.charAt(0) }}</div>
                  <div>
                    <div style="font-weight:600">{{ p.prenom }} {{ p.nom }}</div>
                    <div style="font-size:12px;color:var(--text-muted)">{{ p.sexe === 'F' ? 'Féminin' : 'Masculin' }}</div>
                  </div>
                </div>
              </td>
              <td>{{ p.dateNaissance || '—' }}</td>
              <td>{{ p.telephone || '—' }}</td>
              <td>{{ p.groupeSanguin || '—' }}</td>
              <td *ngIf="!isMedecin" style="text-align:right">
                <button class="btn btn-ghost btn-sm" (click)="edit(p)" style="margin-right:6px">
                  <i class="fa fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" (click)="remove(p.id)">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0">
              <td [attr.colspan]="isMedecin ? 5 : 6">
                <div class="empty-state">
                  <i class="fa fa-users"></i>
                  <p>{{ isMedecin ? 'Aucun patient associé à vos rendez-vous' : 'Aucun patient enregistré' }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PatientsComponent implements OnInit {
  items: any[] = [];
  editingId?: number;
  showForm = false;
  isMedecin = false;
  medecinId?: number;

  form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: [''],
    sexe: ['F'],
    telephone: [''],
    adresse: [''],
    groupeSanguin: [''],
    allergies: [''],
    antecedents: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isMedecin = this.auth.role() === 'MEDECIN';
    if (this.isMedecin) {
      const uid = this.auth.current()?.id;
      if (!uid) return;
      this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe((m) => {
        if (m) {
          this.medecinId = m.id;
          this.api.patientsByMedecin(m.id).subscribe((p) => this.items = p);
        }
      });
    } else {
      this.load();
    }
  }

  load(): void { this.api.patients().subscribe((d) => this.items = d); }

  save(): void {
    if (this.form.invalid) return;
    this.api.savePatient(this.form.getRawValue(), this.editingId).subscribe(() => { this.reset(); this.load(); });
  }

  edit(p: any): void { this.editingId = p.id; this.showForm = true; this.form.patchValue(p); }
  reset(): void { this.editingId = undefined; this.showForm = false; this.form.reset({ sexe: 'F' }); }
  remove(id: number): void {
    if (confirm('Supprimer ce patient ?')) this.api.deletePatient(id).subscribe(() => this.load());
  }
}
