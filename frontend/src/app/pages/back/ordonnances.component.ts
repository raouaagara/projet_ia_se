import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor } from '@angular/common';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-ordonnances',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  template: `
    <div class="grid" style="grid-template-columns: 1fr 1.3fr; gap: 20px;">
      <section class="card">
        <h3>Ordonnance</h3>
        <form [formGroup]="form" (ngSubmit)="save()">
          <label>Consultation
            <select formControlName="consultationId">
              <option *ngFor="let c of consultations" [ngValue]="c.id">#{{ c.id }} — {{ c.patientNom }}</option>
            </select>
          </label>
          <label>Date <input type="date" formControlName="dateEmission"></label>
          <label>Médicaments <textarea formControlName="medicaments"></textarea></label>
          <label>Posologie <input formControlName="posologie"></label>
          <label>Instructions <input formControlName="instructions"></label>
          <button class="btn" type="submit">Enregistrer</button>
        </form>
      </section>
      <section class="card">
        <h3>Ordonnances</h3>
        <table>
          <tr><th>Date</th><th>Patient</th><th>Médicaments</th><th></th></tr>
          <tr *ngFor="let o of items">
            <td>{{ o.dateEmission }}</td>
            <td>{{ o.patientNom }}</td>
            <td>{{ o.medicaments }}</td>
            <td>
              <button class="btn ghost" (click)="edit(o)">Éditer</button>
              <button class="btn danger" (click)="remove(o.id)">Suppr.</button>
            </td>
          </tr>
        </table>
      </section>
    </div>
  `
})
export class OrdonnancesComponent implements OnInit {
  items: any[] = [];
  consultations: any[] = [];
  editingId?: number;
  form = this.fb.group({
    consultationId: [null as number | null, Validators.required],
    dateEmission: [''],
    medicaments: ['', Validators.required],
    posologie: [''],
    instructions: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService) {}
  ngOnInit(): void {
    this.api.consultations().subscribe((c) => this.consultations = c);
    this.load();
  }
  load(): void { this.api.ordonnances().subscribe((d) => this.items = d); }
  save(): void {
    if (this.form.invalid) return;
    this.api.saveOrdonnance(this.form.getRawValue(), this.editingId).subscribe(() => { this.editingId = undefined; this.form.reset(); this.load(); });
  }
  edit(o: any): void { this.editingId = o.id; this.form.patchValue(o); }
  remove(id: number): void { this.api.deleteOrdonnance(id).subscribe(() => this.load()); }
}
