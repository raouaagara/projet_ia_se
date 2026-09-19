import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, SlicePipe],
  template: `
    <div class="page-header">
      <div class="page-header-info">
        <h2><i class="fa fa-stethoscope" style="color:var(--primary)"></i> Consultations</h2>
        <p *ngIf="isMedecin">Vos consultations réalisées</p>
        <p *ngIf="!isMedecin">Toutes les consultations de la clinique</p>
      </div>
      <button class="btn btn-primary" (click)="showForm = !showForm">
        <i class="fa fa-plus"></i> Nouvelle consultation
      </button>
    </div>

    <!-- FORM -->
    <div class="card animate-fade-up" style="margin-bottom:20px" *ngIf="showForm">
      <div class="card-header">
        <div class="card-title">
          <i class="fa fa-notes-medical"></i>
          {{ editingId ? 'Modifier la consultation' : 'Nouvelle consultation' }}
        </div>
        <button class="btn btn-ghost btn-sm" (click)="reset()"><i class="fa fa-xmark"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Patient *</label>
            <select class="form-control" formControlName="patientId">
              <option [ngValue]="null">Sélectionner un patient</option>
              <option *ngFor="let p of patients" [ngValue]="p.id">{{ p.prenom }} {{ p.nom }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="!isMedecin">
            <label class="form-label">Médecin *</label>
            <select class="form-control" formControlName="medecinId">
              <option [ngValue]="null">Sélectionner un médecin</option>
              <option *ngFor="let m of medecins" [ngValue]="m.id">Dr {{ m.prenom }} {{ m.nom }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Date & Heure</label>
          <input class="form-control" type="datetime-local" formControlName="dateConsultation">
        </div>
        <div class="form-group">
          <label class="form-label">Diagnostic</label>
          <input class="form-control" formControlName="diagnostic" placeholder="Diagnostic médical">
        </div>
        <div class="form-group">
          <label class="form-label">Observations</label>
          <textarea class="form-control" formControlName="observations" placeholder="Observations cliniques..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Traitement prescrit</label>
          <input class="form-control" formControlName="traitement" placeholder="Médicaments, durée...">
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
        <div class="card-title">
          <i class="fa fa-list"></i>
          {{ isMedecin ? 'Mes consultations' : 'Toutes les consultations' }} ({{ items.length }})
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th *ngIf="!isMedecin">Médecin</th>
              <th>Diagnostic</th>
              <th>Traitement</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of items">
              <td>
                <div style="font-weight:600">{{ c.dateConsultation | slice:0:10 }}</div>
                <div style="font-size:12px;color:var(--text-muted)">{{ c.dateConsultation | slice:11:16 }}</div>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar avatar-sm">{{ c.patientNom?.charAt(0) }}</div>
                  {{ c.patientNom }}
                </div>
              </td>
              <td *ngIf="!isMedecin">{{ c.medecinNom }}</td>
              <td>{{ c.diagnostic || '—' }}</td>
              <td>{{ c.traitement || '—' }}</td>
              <td style="text-align:right">
                <button class="btn btn-ghost btn-sm" (click)="edit(c)" style="margin-right:6px">
                  <i class="fa fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" *ngIf="!isMedecin" (click)="remove(c.id)">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="items.length === 0">
              <td [attr.colspan]="isMedecin ? 5 : 6">
                <div class="empty-state">
                  <i class="fa fa-stethoscope"></i>
                  <p>Aucune consultation enregistrée</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ConsultationsComponent implements OnInit {
  items: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  editingId?: number;
  showForm = false;
  isMedecin = false;
  medecinId?: number;

  form = this.fb.group({
    patientId: [null as number | null, Validators.required],
    medecinId: [null as number | null],
    dateConsultation: [''],
    diagnostic: [''],
    observations: [''],
    traitement: ['']
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
          // Pré-remplir le médecin dans le formulaire
          this.form.patchValue({ medecinId: m.id });
          // Charger seulement les patients de ce médecin
          this.api.patientsByMedecin(m.id).subscribe((p) => this.patients = p);
          this.load();
        }
      });
    } else {
      this.api.patients().subscribe((p) => this.patients = p);
      this.api.medecins().subscribe((m) => this.medecins = m);
      this.load();
    }
  }

  load(): void {
    if (this.isMedecin && this.medecinId) {
      this.api.consultationsMedecin(this.medecinId).subscribe((d) => this.items = d);
    } else {
      this.api.consultations().subscribe((d) => this.items = d);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const payload = { ...this.form.getRawValue() };
    // Si médecin, forcer son propre ID
    if (this.isMedecin && this.medecinId) {
      payload.medecinId = this.medecinId;
    }
    this.api.saveConsultation(payload, this.editingId).subscribe(() => {
      this.reset();
      this.load();
    });
  }

  edit(c: any): void {
    this.editingId = c.id;
    this.showForm = true;
    this.form.patchValue({ ...c, dateConsultation: (c.dateConsultation || '').slice(0, 16) });
  }

  reset(): void {
    this.editingId = undefined;
    this.showForm = false;
    this.form.reset();
    if (this.isMedecin && this.medecinId) {
      this.form.patchValue({ medecinId: this.medecinId });
    }
  }

  remove(id: number): void {
    if (confirm('Supprimer cette consultation ?')) this.api.deleteConsultation(id).subscribe(() => this.load());
  }
}
