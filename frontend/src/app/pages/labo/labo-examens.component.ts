import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-labo-examens',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, ReactiveFormsModule],
  template: `
    <div class="le-page">

      <!-- KPIs -->
      <div class="le-kpis">
        <div class="le-kpi" *ngFor="let k of kpis">
          <div class="le-kpi-icon" [style.background]="k.bg" [style.color]="k.color">
            <i [class]="'fa '+k.icon"></i>
          </div>
          <div>
            <div class="le-kpi-v">{{ k.val }}</div>
            <div class="le-kpi-l">{{ k.label }}</div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="le-filters">
        <button class="le-filter" [class.active]="tab==='all'"    (click)="tab='all'">
          Tous <span class="le-cnt">{{ items.length }}</span>
        </button>
        <button class="le-filter" [class.active]="tab==='DEMANDE'" (click)="tab='DEMANDE'">
          <span class="dot dot-blue"></span>En attente <span class="le-cnt">{{ count('DEMANDE') }}</span>
        </button>
        <button class="le-filter" [class.active]="tab==='EN_COURS'" (click)="tab='EN_COURS'">
          <span class="dot dot-orange"></span>En cours <span class="le-cnt">{{ count('EN_COURS') }}</span>
        </button>
        <button class="le-filter" [class.active]="tab==='RESULTAT_DISPONIBLE'" (click)="tab='RESULTAT_DISPONIBLE'">
          <span class="dot dot-green"></span>Terminés <span class="le-cnt green">{{ count('RESULTAT_DISPONIBLE') }}</span>
        </button>
      </div>

      <!-- Liste -->
      <div class="le-list">
        <div class="le-empty" *ngIf="filtered().length === 0">
          <i class="fa fa-flask"></i><p>Aucun examen dans cette catégorie</p>
        </div>

        <div class="le-card" *ngFor="let e of filtered()">
          <!-- Bande gauche -->
          <div class="le-band" [class]="'band-'+e.statut?.toLowerCase()">
            <i class="fa fa-flask"></i>
            <span>{{ statutShort(e.statut) }}</span>
          </div>

          <!-- Corps -->
          <div class="le-body">
            <div class="le-row1">
              <span class="le-type">{{ e.typeExamen }}</span>
              <span class="le-badge" [class]="'badge-'+e.statut?.toLowerCase()">{{ statutLabel(e.statut) }}</span>
              <span class="le-date"><i class="fa fa-calendar"></i> {{ e.dateDemande | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="le-row2">
              <div class="le-person patient">
                <div class="le-av green">{{ e.patientNom?.charAt(0) }}</div>
                <div><small>Patient</small><span>{{ e.patientNom }}</span></div>
              </div>
              <i class="fa fa-arrow-right" style="color:#d1d5db"></i>
              <div class="le-person medecin">
                <div class="le-av blue">{{ e.medecinNom?.charAt(3) }}</div>
                <div><small>Prescripteur</small><span>{{ e.medecinNom }}</span></div>
              </div>
            </div>
            <div class="le-desc" *ngIf="e.description">
              <i class="fa fa-circle-info"></i> {{ e.description }}
            </div>
            <!-- Résultat existant -->
            <div class="le-resultat" *ngIf="e.resultatTexte">
              <i class="fa fa-microscope"></i>
              <pre>{{ e.resultatTexte }}</pre>
            </div>
          </div>

          <!-- Actions -->
          <div class="le-actions">
            <button class="le-btn primary" (click)="ouvrirSaisie(e)"
                    [disabled]="e.statut === 'ANNULE'">
              <i class="fa fa-microscope"></i>
              {{ e.resultatTexte ? 'Modifier résultat' : 'Saisir résultat' }}
            </button>
            <button class="le-btn warning" (click)="changerStatut(e,'EN_COURS')"
                    *ngIf="e.statut === 'DEMANDE'">
              <i class="fa fa-spinner"></i> En cours
            </button>
            <button class="le-btn danger" (click)="changerStatut(e,'ANNULE')"
                    *ngIf="e.statut !== 'ANNULE' && e.statut !== 'RESULTAT_DISPONIBLE'">
              <i class="fa fa-ban"></i> Annuler
            </button>
          </div>
        </div>
      </div>

      <!-- ════ MODAL SAISIE RÉSULTAT ════ -->
      <div class="le-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="le-modal" (click)="$event.stopPropagation()">

          <div class="le-modal-head">
            <div class="le-modal-icon"><i class="fa fa-microscope"></i></div>
            <div>
              <h3 class="le-modal-title">Publication du résultat</h3>
              <p class="le-modal-sub" *ngIf="selected">
                {{ selected.typeExamen }} — <strong>{{ selected.patientNom }}</strong>
              </p>
            </div>
            <button class="le-close" (click)="closeModal()"><i class="fa fa-xmark"></i></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="publier()" class="le-modal-body">

            <div class="le-form-row">
              <div class="le-field">
                <label>Date du résultat</label>
                <input type="date" formControlName="dateResultat">
              </div>
            </div>

            <div class="le-field">
              <label>Résultat (texte) <span class="req">*</span></label>
              <textarea formControlName="resultatTexte" rows="8"
                placeholder="Saisissez les valeurs mesurées et l'interprétation…&#10;&#10;Exemple :&#10;NFS :&#10;  Globules rouges : 4.8 M/µL (N: 4.5–5.5)&#10;  Hémoglobine    : 13.5 g/dL (N: 12–16)&#10;  Plaquettes     : 250 K/µL (N: 150–400)&#10;&#10;Conclusion : Bilan hématologique normal."></textarea>
            </div>

            <div class="le-field">
              <label>Fichier / Lien (optionnel)</label>
              <input type="text" formControlName="fichierResultat"
                     placeholder="URL du fichier PDF ou nom du fichier…">
            </div>

            <div class="le-field">
              <label>Notes internes</label>
              <input type="text" formControlName="notes"
                     placeholder="Remarques pour l'équipe médicale…">
            </div>

            <!-- Avertissement notification -->
            <div class="le-notif-warn">
              <i class="fa fa-bell"></i>
              <div>
                <strong>Notifications automatiques</strong>
                <p>En publiant ce résultat, deux notifications seront envoyées automatiquement :
                   une au <strong>patient</strong> ({{ selected?.patientNom }}) et
                   une au <strong>médecin prescripteur</strong> ({{ selected?.medecinNom }}).</p>
              </div>
            </div>

            <div class="le-modal-actions">
              <button type="button" class="le-btn-ghost" (click)="closeModal()">Annuler</button>
              <button type="submit" class="le-btn-publish" [disabled]="form.invalid || saving">
                <i class="fa fa-paper-plane"></i>
                {{ saving ? 'Publication…' : 'Publier le résultat' }}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .le-page { display:flex; flex-direction:column; gap:18px; animation:fadeUp .4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    /* KPIs */
    .le-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
    .le-kpi { background:var(--surface,#fff); border-radius:13px; padding:16px 14px;
      border:1.5px solid var(--border,#e2e8f0); display:flex; align-items:center; gap:12px;
      box-shadow:0 2px 6px rgba(0,0,0,.04); }
    .le-kpi-icon { width:42px; height:42px; border-radius:11px; display:flex;
      align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
    .le-kpi-v { font-size:22px; font-weight:900; color:var(--text,#0f172a); }
    .le-kpi-l { font-size:12px; color:var(--text-muted,#64748b); }

    /* Filtres */
    .le-filters { display:flex; gap:6px; flex-wrap:wrap;
      background:var(--surface,#fff); border-radius:13px; padding:10px 12px;
      border:1.5px solid var(--border,#e2e8f0); }
    .le-filter { display:flex; align-items:center; gap:6px; padding:7px 14px;
      border-radius:9px; border:none; background:transparent;
      color:var(--text-muted,#64748b); font-size:13px; font-weight:600; cursor:pointer; transition:all .18s; }
    .le-filter:hover  { background:var(--bg,#f0f4f8); }
    .le-filter.active { background:#f3e8ff; color:#7e22ce; }
    .le-cnt { min-width:18px; height:18px; border-radius:999px; padding:0 5px;
      background:var(--bg,#f0f4f8); color:var(--text-muted,#64748b);
      font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; }
    .le-cnt.green { background:#dcfce7; color:#15803d; }
    .dot { width:8px; height:8px; border-radius:50%; }
    .dot-blue   { background:#3b82f6; }
    .dot-orange { background:#f59e0b; }
    .dot-green  { background:#22c55e; }

    /* Liste */
    .le-list { display:flex; flex-direction:column; gap:10px; }
    .le-empty { text-align:center; padding:50px; background:var(--surface,#fff);
      border-radius:14px; border:1.5px solid var(--border,#e2e8f0); color:var(--text-muted,#94a3b8); }
    .le-empty i { font-size:32px; display:block; margin-bottom:10px; color:#ddd6fe; }
    .le-empty p { margin:0; font-size:13px; }

    .le-card { display:flex; background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid var(--border,#e2e8f0); overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,.05); transition:transform .2s; }
    .le-card:hover { transform:translateY(-2px); }

    .le-band { width:68px; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:5px; padding:12px 6px; flex-shrink:0; }
    .le-band i { font-size:20px; color:#fff; }
    .le-band span { font-size:9px; font-weight:800; color:rgba(255,255,255,.9);
      text-transform:uppercase; text-align:center; letter-spacing:.04em; }
    .band-demande             { background:linear-gradient(160deg,#3b82f6,#0f6cbd); }
    .band-en_cours            { background:linear-gradient(160deg,#f59e0b,#f97316); }
    .band-resultat_disponible { background:linear-gradient(160deg,#22c55e,#00b389); }
    .band-annule              { background:linear-gradient(160deg,#94a3b8,#64748b); }

    .le-body { flex:1; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
    .le-row1 { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .le-type { font-size:15px; font-weight:900; color:var(--text,#0f172a); }
    .le-date { font-size:12px; color:var(--text-muted,#64748b); display:flex; align-items:center; gap:4px; margin-left:auto; }

    .le-row2 { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .le-person { display:flex; align-items:center; gap:8px; }
    .le-av { width:34px; height:34px; border-radius:10px; flex-shrink:0;
      font-size:12px; font-weight:800; color:#fff;
      display:flex; align-items:center; justify-content:center; }
    .le-av.green { background:linear-gradient(135deg,#22c55e,#00b389); }
    .le-av.blue  { background:linear-gradient(135deg,#0f6cbd,#4338ca); }
    .le-person small { display:block; font-size:10px; color:var(--text-muted,#94a3b8);
      text-transform:uppercase; letter-spacing:.04em; }
    .le-person span  { display:block; font-size:13px; font-weight:700; color:var(--text,#0f172a); }

    .le-desc { font-size:12.5px; color:var(--text-muted,#64748b); display:flex; align-items:center; gap:6px; }
    .le-resultat { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px 14px; }
    .le-resultat i { color:#15803d; margin-right:6px; }
    .le-resultat pre { font-size:12px; color:var(--text,#0f172a); margin:4px 0 0;
      white-space:pre-wrap; font-family:monospace; }

    .le-badge { padding:3px 10px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .badge-demande             { background:#dbeafe; color:#1d4ed8; }
    .badge-en_cours            { background:#fff7ed; color:#c2410c; }
    .badge-resultat_disponible { background:#dcfce7; color:#15803d; }
    .badge-annule              { background:#f1f5f9; color:#64748b; }

    .le-actions { display:flex; flex-direction:column; gap:6px;
      padding:16px 12px; border-left:1.5px solid var(--border,#f1f5f9);
      flex-shrink:0; justify-content:center; }
    .le-btn { display:flex; align-items:center; gap:6px; padding:8px 14px;
      border-radius:9px; border:none; cursor:pointer; font-size:12.5px; font-weight:700;
      transition:all .18s; white-space:nowrap; }
    .le-btn.primary { background:#f3e8ff; color:#7e22ce; }
    .le-btn.primary:hover:not(:disabled) { background:#7e22ce; color:#fff; }
    .le-btn.warning { background:#fef9c3; color:#854d0e; }
    .le-btn.warning:hover { background:#f59e0b; color:#fff; }
    .le-btn.danger  { background:#fff5f5; color:#b91c1c; }
    .le-btn.danger:hover  { background:#ef4444; color:#fff; }
    .le-btn:disabled { opacity:.4; cursor:not-allowed; }

    /* Modal */
    .le-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:500;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation:fadeIn .2s ease; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .le-modal { background:var(--surface,#fff); border-radius:22px; width:100%;
      max-width:620px; max-height:90vh; overflow-y:auto;
      box-shadow:0 24px 64px rgba(0,0,0,.25); animation:slideUp .25s ease; }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    .le-modal-head { display:flex; align-items:center; gap:14px; padding:22px 24px;
      background:linear-gradient(135deg,#f5f3ff,#ede9fe);
      border-bottom:1.5px solid #ddd6fe; position:sticky; top:0; }
    .le-modal-icon { width:46px; height:46px; border-radius:13px; flex-shrink:0;
      background:linear-gradient(135deg,#7e22ce,#4338ca);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px; }
    .le-modal-title { font-size:17px; font-weight:900; color:var(--text,#0f172a); margin:0 0 3px; }
    .le-modal-sub   { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .le-close { background:none; border:none; cursor:pointer; color:var(--text-muted,#94a3b8);
      font-size:16px; padding:6px; border-radius:8px; margin-left:auto;
      transition:all .15s; }
    .le-close:hover { color:#ef4444; background:#fff5f5; }

    .le-modal-body  { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .le-form-row    { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .le-field { display:flex; flex-direction:column; gap:5px; }
    .le-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .req { color:#ef4444; }
    .le-field input, .le-field textarea {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px;
      outline:none; transition:border-color .2s; font-family:inherit; resize:vertical;
    }
    .le-field input:focus, .le-field textarea:focus {
      border-color:#7e22ce; background:#fff;
    }

    .le-notif-warn { display:flex; align-items:flex-start; gap:12px;
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border:1.5px solid #fde68a; border-radius:12px; padding:14px 16px; }
    .le-notif-warn i { color:#f59e0b; font-size:18px; flex-shrink:0; margin-top:2px; }
    .le-notif-warn strong { display:block; font-size:13px; color:#854d0e; margin-bottom:4px; }
    .le-notif-warn p { font-size:12.5px; color:#92400e; margin:0; line-height:1.5; }

    .le-modal-actions { display:flex; justify-content:flex-end; gap:10px;
      padding-top:8px; border-top:1.5px solid var(--border,#f1f5f9); }
    .le-btn-ghost { padding:10px 20px; border-radius:11px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b); font-size:13.5px;
      font-weight:600; cursor:pointer; transition:all .18s; }
    .le-btn-ghost:hover { background:#f5f3ff; border-color:#ddd6fe; color:#7e22ce; }
    .le-btn-publish { display:inline-flex; align-items:center; gap:7px; padding:11px 22px;
      border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#7e22ce,#4338ca); color:#fff;
      font-size:14px; font-weight:700; transition:all .2s;
      box-shadow:0 4px 14px rgba(126,34,206,.35); }
    .le-btn-publish:hover:not(:disabled) { transform:translateY(-2px); }
    .le-btn-publish:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class LaboExamensComponent implements OnInit {

  items: any[] = [];
  tab    = 'all';
  selected: any = null;
  showModal = false;
  saving    = false;

  form = this.fb.group({
    dateResultat:    [new Date().toISOString().split('T')[0]],
    resultatTexte:   ['', Validators.required],
    fichierResultat: [''],
    notes:           ['']
  });

  get kpis() {
    return [
      { val: this.items.length,                 label: 'Total',            icon: 'fa-flask',        bg: '#f3e8ff', color: '#7e22ce' },
      { val: this.count('DEMANDE'),             label: 'En attente',       icon: 'fa-clock',        bg: '#dbeafe', color: '#1d4ed8' },
      { val: this.count('EN_COURS'),            label: 'En cours',         icon: 'fa-spinner',      bg: '#fff7ed', color: '#c2410c' },
      { val: this.count('RESULTAT_DISPONIBLE'), label: 'Résultats publiés',icon: 'fa-circle-check', bg: '#dcfce7', color: '#15803d' }
    ];
  }

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.examens().subscribe(d => this.items = d);
  }

  ouvrirSaisie(e: any): void {
    this.selected = e;
    this.showModal = true;
    this.form.patchValue({
      dateResultat:    e.dateResultat ?? new Date().toISOString().split('T')[0],
      resultatTexte:   e.resultatTexte ?? '',
      fichierResultat: e.fichierResultat ?? '',
      notes:           e.notes ?? ''
    });
  }

  publier(): void {
    if (this.form.invalid || !this.selected) return;
    this.saving = true;
    const v = this.form.getRawValue();
    this.api.publierResultat({
      examenId:        this.selected.id,
      resultatTexte:   v.resultatTexte ?? '',
      fichierResultat: v.fichierResultat || undefined,
      notes:           v.notes || undefined,
      dateResultat:    v.dateResultat || undefined
    }).subscribe({
      next: (updated) => {
        // Mettre à jour en local
        const idx = this.items.findIndex(x => x.id === updated.id);
        if (idx >= 0) this.items[idx] = updated;
        this.closeModal();
        this.saving = false;
      },
      error: () => this.saving = false
    });
  }

  changerStatut(e: any, statut: string): void {
    this.api.saveExamen({ ...e, statut }, e.id).subscribe(updated => {
      const idx = this.items.findIndex(x => x.id === e.id);
      if (idx >= 0) this.items[idx] = updated;
    });
  }

  closeModal(): void { this.showModal = false; this.selected = null; this.form.reset({ dateResultat: new Date().toISOString().split('T')[0] }); }

  filtered(): any[] { return this.tab === 'all' ? this.items : this.items.filter(e => e.statut === this.tab); }
  count(s: string): number { return this.items.filter(e => e.statut === s).length; }

  statutLabel(s: string): string {
    const m: Record<string,string> = { DEMANDE:'En attente', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Résultat publié', ANNULE:'Annulé' };
    return m[s] ?? s;
  }
  statutShort(s: string): string {
    const m: Record<string,string> = { DEMANDE:'Attente', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Publié', ANNULE:'Annulé' };
    return m[s] ?? s;
  }
}
