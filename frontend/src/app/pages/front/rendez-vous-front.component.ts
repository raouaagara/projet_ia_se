import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MedecinWidgetComponent } from '../../shared/medecin-widget.component';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-rdv-front',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, SlicePipe, MedecinWidgetComponent],
  template: `
    <div class="p-rdv">

      <!-- ── TOOLBAR ──────────────────────────────────── -->
      <div class="p-toolbar reveal">
        <div class="p-toolbar-left">
          <span class="p-toolbar-count">
            <i class="fa fa-calendar-check"></i>
            {{ rdvs.length }} rendez-vous
          </span>
        </div>
        <button class="p-btn-primary" (click)="showForm = !showForm">
          <i [class]="showForm ? 'fa fa-xmark' : 'fa fa-plus'"></i>
          {{ showForm ? 'Annuler' : 'Nouveau rendez-vous' }}
        </button>
      </div>

      <!-- ── SUCCÈS ────────────────────────────────────── -->
      <div class="p-success reveal" *ngIf="success">
        <div class="p-success-icon"><i class="fa fa-circle-check"></i></div>
        <div class="p-success-text">
          <strong>Demande envoyée !</strong>
          <span>Votre rendez-vous est en attente de confirmation par le médecin.</span>
        </div>
        <button class="p-success-close" (click)="success=false"><i class="fa fa-xmark"></i></button>
      </div>

      <!-- ── FORMULAIRE ────────────────────────────────── -->
      <div class="p-form-card reveal" *ngIf="showForm">
        <div class="p-form-header">
          <div class="p-form-header-icon"><i class="fa fa-calendar-plus"></i></div>
          <div>
            <div class="p-form-title">Nouveau rendez-vous</div>
            <div class="p-form-sub">Choisissez votre médecin, la date et décrivez votre motif</div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="create()" class="p-form-body">

          <!-- Médecins -->
          <div class="p-field-label">Sélectionner un médecin <span class="req">*</span></div>
          <div class="p-med-grid">
            <app-medecin-widget
              *ngFor="let m of medecins"
              [medecin]="m"
              [selected]="form.get('medecinId')?.value === m.id"
              (click)="m.disponible && selectMed(m.id)"
              [style.opacity]="m.disponible ? '1' : '0.45'"
              [style.cursor]="m.disponible ? 'pointer' : 'not-allowed'"
            ></app-medecin-widget>
          </div>

          <div class="p-form-row">
            <div class="p-field">
              <label class="p-field-label">Date et heure <span class="req">*</span></label>
              <input class="p-input" type="datetime-local" formControlName="dateHeure">
            </div>
            <div class="p-field">
              <label class="p-field-label">Motif de consultation</label>
              <input class="p-input" formControlName="motif" placeholder="Douleur, bilan, suivi…">
            </div>
          </div>

          <div class="p-alert" *ngIf="error">
            <i class="fa fa-triangle-exclamation"></i> {{ error }}
          </div>

          <div class="p-form-actions">
            <button type="button" class="p-btn-ghost" (click)="showForm=false">Annuler</button>
            <button type="submit" class="p-btn-primary" [disabled]="loading">
              <span class="p-spin" *ngIf="loading"></span>
              <i class="fa fa-calendar-check" *ngIf="!loading"></i>
              {{ loading ? 'Confirmation…' : 'Confirmer' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ── LISTE ──────────────────────────────────────── -->
      <div class="p-list-wrap reveal">

        <!-- Skeleton -->
        <div class="p-skeletons" *ngIf="loadingRdvs">
          <div class="p-sk" *ngFor="let x of [1,2,3]"></div>
        </div>

        <!-- Vide -->
        <div class="p-empty" *ngIf="!loadingRdvs && rdvs.length===0">
          <div class="p-empty-circle">
            <i class="fa fa-calendar-xmark"></i>
          </div>
          <h3>Aucun rendez-vous</h3>
          <p>Prenez votre premier rendez-vous dès maintenant</p>
          <button class="p-btn-primary" (click)="showForm=true">
            <i class="fa fa-plus"></i> Nouveau rendez-vous
          </button>
        </div>

        <!-- Cards -->
        <div class="p-rdv-grid" *ngIf="!loadingRdvs && rdvs.length > 0">
          <div class="p-rdv-card reveal-item" *ngFor="let r of rdvs; let i = index"
               [style.animation-delay]="i * 0.07 + 's'">

            <!-- Bande date -->
            <div class="p-rdv-band" [class]="bandClass(r.statut)">
              <span class="p-rdv-day">{{ r.dateHeure | slice:8:10 }}</span>
              <span class="p-rdv-mon">{{ monthShort(r.dateHeure) }}</span>
              <span class="p-rdv-yr">{{ r.dateHeure | slice:0:4 }}</span>
            </div>

            <!-- Corps -->
            <div class="p-rdv-body">
              <div class="p-rdv-hour">
                <i class="fa fa-clock"></i> {{ r.dateHeure | slice:11:16 }}
              </div>
              <div class="p-rdv-doc">
                <div class="p-rdv-doc-av">{{ r.medecinNom?.charAt(4) }}</div>
                {{ r.medecinNom }}
              </div>
              <div class="p-rdv-motif" *ngIf="r.motif">
                <i class="fa fa-note-medical"></i> {{ r.motif }}
              </div>
            </div>

            <!-- Badge statut -->
            <div class="p-rdv-right">
              <span class="p-badge" [class]="badgeClass(r.statut)">{{ statusLabel(r.statut) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes slideDown{ from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .reveal      { animation: fadeUp .55s ease both; }
    .reveal-item { animation: fadeUp .5s ease both; }

    .p-rdv { display:flex; flex-direction:column; gap:22px; }

    /* Toolbar */
    .p-toolbar {
      display:flex; align-items:center; justify-content:space-between;
      background:#fff; border-radius:16px; padding:16px 22px;
      border:1.5px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .p-toolbar-count {
      display:flex; align-items:center; gap:8px;
      font-size:15px; font-weight:700; color:#0f172a;
    }
    .p-toolbar-count i { color:#0f6cbd; font-size:16px; }

    /* Boutons */
    .p-btn-primary {
      display:inline-flex; align-items:center; gap:8px;
      padding:11px 22px; border-radius:12px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:14px; font-weight:700; transition:all .22s;
      box-shadow:0 4px 14px rgba(15,108,189,.3);
    }
    .p-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,108,189,.4); }
    .p-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
    .p-btn-ghost {
      padding:11px 22px; border-radius:12px; border:1.5px solid #e2e8f0;
      background:#fff; color:#64748b; font-size:14px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .p-btn-ghost:hover { background:#f0f9ff; border-color:#bfdbfe; color:#0f6cbd; }

    /* Succès */
    .p-success {
      display:flex; align-items:center; gap:16px;
      background:linear-gradient(135deg,#e6faf5,#dcfce7);
      border:1.5px solid #86efac; border-radius:16px; padding:16px 22px;
      animation:slideDown .3s ease;
    }
    .p-success-icon { font-size:28px; color:#15803d; flex-shrink:0; }
    .p-success-text strong { display:block; font-size:15px; font-weight:800; color:#15803d; }
    .p-success-text span   { font-size:13px; color:#166534; opacity:.8; }
    .p-success-close { margin-left:auto; background:none; border:none; cursor:pointer; color:#15803d; font-size:16px; opacity:.6; }
    .p-success-close:hover { opacity:1; }

    /* Formulaire */
    .p-form-card {
      background:#fff; border-radius:20px; border:1.5px solid #e2e8f0;
      box-shadow:0 8px 32px rgba(0,0,0,.08); overflow:hidden;
      animation:slideDown .25s ease;
    }
    .p-form-header {
      display:flex; align-items:center; gap:16px;
      padding:22px 28px; background:linear-gradient(135deg,#f0f9ff,#e6faf5);
      border-bottom:1.5px solid #e2e8f0;
    }
    .p-form-header-icon {
      width:50px; height:50px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px;
    }
    .p-form-title { font-size:17px; font-weight:800; color:#0f172a; }
    .p-form-sub   { font-size:12.5px; color:#64748b; margin-top:3px; }
    .p-form-body  { padding:24px 28px; display:flex; flex-direction:column; gap:20px; }
    .p-form-row   { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .p-form-actions { display:flex; gap:12px; justify-content:flex-end; padding-top:8px; border-top:1.5px solid #f1f5f9; }

    .p-field-label { font-size:13px; font-weight:700; color:#475569; margin-bottom:10px; display:block; }
    .req  { color:#ef4444; }
    .p-field { display:flex; flex-direction:column; gap:5px; }
    .p-input {
      padding:11px 14px; border-radius:11px; border:1.5px solid #e2e8f0;
      background:#f8fafc; color:#0f172a; font-size:14px; outline:none;
      transition:border-color .2s; font-family:inherit;
    }
    .p-input:focus { border-color:#0f6cbd; background:#fff; box-shadow:0 0 0 3px rgba(15,108,189,.08); }
    .p-alert {
      display:flex; align-items:center; gap:8px;
      background:#fff5f5; color:#dc2626; border:1.5px solid #fca5a5;
      border-radius:10px; padding:11px 14px; font-size:13px;
    }

    /* Médecin grid */
    .p-med-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:10px; }
    .p-med-card {
      display:flex; align-items:center; gap:10px;
      padding:12px 14px; border-radius:13px; border:2px solid #f1f5f9;
      cursor:pointer; transition:all .18s; background:#f8fafc;
    }
    .p-med-card:hover:not(.p-med-off) { border-color:#0f6cbd; background:#f0f9ff; transform:translateY(-2px); }
    .p-med-selected { border-color:#0f6cbd !important; background:#e8f4ff !important; box-shadow:0 0 0 3px rgba(15,108,189,.12); }
    .p-med-off { opacity:.4; cursor:not-allowed; }
    .p-med-av {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      color:#fff; font-size:13px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .p-med-name { display:block; font-size:13px; font-weight:700; color:#0f172a; }
    .p-med-spec { display:block; font-size:11px; color:#64748b; margin-top:1px; }
    .p-med-info { flex:1; min-width:0; }
    .p-med-dot  { font-size:9px; flex-shrink:0; }
    .dot-on  { color:#22c55e; }
    .dot-off { color:#ef4444; }

    /* Spin */
    .p-spin {
      width:14px; height:14px; border-radius:50%;
      border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
      animation:spin .6s linear infinite; display:inline-block;
    }

    /* Skeleton */
    .p-skeletons { display:flex; flex-direction:column; gap:12px; }
    .p-sk {
      height:90px; border-radius:16px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }

    /* Vide */
    .p-empty { text-align:center; padding:56px 24px; }
    .p-empty-circle {
      width:80px; height:80px; border-radius:50%; margin:0 auto 20px;
      background:linear-gradient(135deg,#f0f9ff,#e6faf5);
      display:flex; align-items:center; justify-content:center;
      font-size:32px; color:#0f6cbd;
    }
    .p-empty h3 { font-size:18px; font-weight:800; color:#0f172a; margin:0 0 8px; }
    .p-empty p  { font-size:14px; color:#64748b; margin:0 0 24px; }

    /* Grid RDV */
    .p-rdv-grid { display:flex; flex-direction:column; gap:12px; }
    .p-rdv-card {
      display:flex; align-items:center; gap:0;
      background:#fff; border-radius:18px; overflow:hidden;
      border:1.5px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,.05);
      transition:all .22s;
    }
    .p-rdv-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,0,0,.1); }

    .p-rdv-band {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      width:72px; min-height:90px; flex-shrink:0; padding:14px 8px;
    }
    .band-blue   { background:linear-gradient(160deg,#0f6cbd,#0a9fd4); }
    .band-green  { background:linear-gradient(160deg,#00b389,#22c55e); }
    .band-red    { background:linear-gradient(160deg,#ef4444,#f97316); }
    .band-gray   { background:linear-gradient(160deg,#94a3b8,#64748b); }

    .p-rdv-day { font-size:26px; font-weight:900; color:#fff; line-height:1; }
    .p-rdv-mon { font-size:11px; font-weight:700; color:rgba(255,255,255,.85); text-transform:uppercase; margin-top:2px; }
    .p-rdv-yr  { font-size:10px; color:rgba(255,255,255,.6); margin-top:1px; }

    .p-rdv-body { flex:1; padding:16px 20px; display:flex; flex-direction:column; gap:6px; }
    .p-rdv-hour {
      display:flex; align-items:center; gap:6px;
      font-size:13px; font-weight:700; color:#0f6cbd;
    }
    .p-rdv-doc {
      display:flex; align-items:center; gap:8px;
      font-size:15px; font-weight:800; color:#0f172a;
    }
    .p-rdv-doc-av {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      color:#fff; font-size:11px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .p-rdv-motif { font-size:13px; color:#64748b; display:flex; align-items:center; gap:6px; }

    .p-rdv-right { padding:0 20px 0 0; }
    .p-badge {
      padding:6px 14px; border-radius:999px; font-size:12px; font-weight:800; white-space:nowrap;
    }
    .badge-planifie { background:#dbeafe; color:#1d4ed8; }
    .badge-confirme { background:#dcfce7; color:#15803d; }
    .badge-annule   { background:#fee2e2; color:#b91c1c; }
    .badge-termine  { background:#f1f5f9; color:#64748b; }

    .p-list-wrap { background:#fff; border-radius:20px; border:1.5px solid #e2e8f0; padding:22px; box-shadow:0 2px 10px rgba(0,0,0,.05); }
  `]
})
export class RendezVousFrontComponent implements OnInit, AfterViewInit {
  medecins: any[] = [];
  rdvs: any[] = [];
  patientId?: number;
  error = '';
  success = false;
  loading = false;
  loadingRdvs = true;
  showForm = false;

  form = this.fb.group({
    medecinId: [null as number | null, Validators.required],
    dateHeure: ['', Validators.required],
    motif: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private el: ElementRef) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    this.api.medecins().subscribe(m => this.medecins = m);
    if (!uid) return;
    this.api.patientByUser(uid).pipe(catchError(() => of(null))).subscribe(p => {
      if (!p) {
        this.api.savePatient({ nom: this.auth.current()?.nom, prenom: this.auth.current()?.prenom, telephone: '', utilisateurId: uid }).subscribe({
          next: (c: any) => { this.patientId = c.id; this.loadRdvs(); },
          error: () => { this.loadingRdvs = false; }
        });
      } else { this.patientId = p.id; this.loadRdvs(); }
    });
  }

  ngAfterViewInit(): void {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => this.el.nativeElement.querySelectorAll('.reveal,.reveal-item').forEach((el: Element) => obs.observe(el)), 100);
  }

  loadRdvs(): void {
    if (!this.patientId) return;
    this.loadingRdvs = true;
    this.api.rdvsPatient(this.patientId).subscribe(r => {
      this.rdvs = r.sort((a: any, b: any) => b.dateHeure?.localeCompare(a.dateHeure));
      this.loadingRdvs = false;
    });
  }

  selectMed(id: number): void { this.form.patchValue({ medecinId: id }); }

  create(): void {
    if (this.form.invalid || !this.patientId) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const v = this.form.getRawValue();
    this.api.saveRdv({ patientId: this.patientId, medecinId: v.medecinId, dateHeure: v.dateHeure, motif: v.motif, statut: 'PLANIFIE' }).subscribe({
      next: () => { this.form.reset(); this.loadRdvs(); this.loading = false; this.showForm = false; this.success = true; setTimeout(() => this.success = false, 5000); },
      error: () => { this.error = 'Impossible de créer le rendez-vous.'; this.loading = false; }
    });
  }

  monthShort(d: string): string {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return d ? months[+d.slice(5, 7) - 1] ?? '' : '';
  }
  statusLabel(s: string): string {
    return ({ PLANIFIE: 'Planifié', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' } as any)[s] ?? s;
  }
  badgeClass(s: string): string { return 'p-badge badge-' + (s || '').toLowerCase(); }
  bandClass(s: string): string {
    const map: Record<string, string> = { PLANIFIE: 'band-blue', CONFIRME: 'band-green', ANNULE: 'band-red', TERMINE: 'band-gray' };
    return 'p-rdv-band ' + (map[s] ?? 'band-blue');
  }
  specGrad(spec: string): string {
    const m: Record<string, string> = { Cardiologie: '#ef4444', Neurologie: '#9333ea', chirurgien: '#0f6cbd', Orthopédie: '#f59e0b', Pédiatrie: '#db2777' };
    return m[spec] ?? '#0f6cbd';
  }
}
