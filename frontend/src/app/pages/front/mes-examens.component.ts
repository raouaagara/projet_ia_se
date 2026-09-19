import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-mes-examens',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
    <div class="me-page">

      <div class="me-header">
        <h2 class="me-title"><i class="fa fa-flask"></i> Mes examens & résultats</h2>
        <p class="me-sub">Suivez vos demandes d'analyse et consultez vos résultats</p>
      </div>

      <!-- Skeletons -->
      <div class="me-skeletons" *ngIf="loading">
        <div class="me-sk" *ngFor="let x of [1,2,3]"></div>
      </div>

      <!-- Vide -->
      <div class="me-empty" *ngIf="!loading && items.length === 0">
        <div class="me-empty-icon"><i class="fa fa-flask"></i></div>
        <h3>Aucun examen</h3>
        <p>Aucune demande d'analyse n'a été effectuée pour le moment.</p>
      </div>

      <!-- Liste -->
      <div class="me-list" *ngIf="!loading && items.length > 0">
        <div class="me-item" *ngFor="let e of items">
          <div class="me-item-band" [class]="bandClass(e.statut)">
            <i class="fa fa-flask"></i>
          </div>
          <div class="me-item-body">
            <div class="me-item-top">
              <span class="me-type">{{ e.typeExamen }}</span>
              <span class="me-badge" [class]="badgeClass(e.statut)">{{ statutLabel(e.statut) }}</span>
            </div>
            <div class="me-meta">
              <span><i class="fa fa-user-doctor"></i> {{ e.medecinNom }}</span>
              <span><i class="fa fa-calendar"></i> Demandé le {{ e.dateDemande | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="e.dateResultat"><i class="fa fa-calendar-check"></i> Résultat le {{ e.dateResultat | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="me-resultat" *ngIf="e.resultatTexte">
              <div class="me-resultat-head"><i class="fa fa-microscope"></i> Résultat</div>
              <p>{{ e.resultatTexte }}</p>
            </div>
            <div class="me-fichier" *ngIf="e.fichierResultat">
              <i class="fa fa-paperclip"></i>
              <a [href]="e.fichierResultat" target="_blank">{{ e.fichierResultat }}</a>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .me-page { display:flex; flex-direction:column; gap:20px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .me-header { background:linear-gradient(135deg,#7e22ce,#4338ca); border-radius:18px;
      padding:24px 28px; color:#fff; }
    .me-title { font-size:22px; font-weight:900; margin:0 0 6px;
      display:flex; align-items:center; gap:10px; }
    .me-sub { font-size:13px; color:rgba(255,255,255,.75); margin:0; }

    .me-skeletons { display:flex; flex-direction:column; gap:12px; }
    .me-sk { height:100px; border-radius:14px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; }

    .me-empty { text-align:center; padding:60px 24px; background:var(--surface,#fff);
      border-radius:18px; border:1.5px solid var(--border,#e2e8f0); }
    .me-empty-icon { width:80px; height:80px; border-radius:50%; margin:0 auto 20px;
      background:linear-gradient(135deg,#f5f3ff,#ede9fe);
      display:flex; align-items:center; justify-content:center; font-size:32px; color:#7e22ce; }
    .me-empty h3 { font-size:18px; font-weight:800; color:var(--text,#0f172a); margin:0 0 8px; }
    .me-empty p  { font-size:13px; color:var(--text-muted,#64748b); margin:0; }

    .me-list { display:flex; flex-direction:column; gap:12px; }
    .me-item { display:flex; background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid var(--border,#e2e8f0); overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .2s; }
    .me-item:hover { transform:translateY(-2px); }

    .me-item-band { width:60px; min-height:80px; display:flex; align-items:center; justify-content:center;
      font-size:22px; flex-shrink:0; }
    .band-demande             { background:linear-gradient(160deg,#3b82f6,#0f6cbd); color:#fff; }
    .band-en_cours            { background:linear-gradient(160deg,#f59e0b,#f97316); color:#fff; }
    .band-resultat_disponible { background:linear-gradient(160deg,#22c55e,#00b389); color:#fff; }
    .band-annule              { background:linear-gradient(160deg,#94a3b8,#64748b); color:#fff; }

    .me-item-body { flex:1; padding:16px 20px; display:flex; flex-direction:column; gap:8px; }
    .me-item-top  { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .me-type { font-size:15px; font-weight:800; color:var(--text,#0f172a); }
    .me-meta { display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px; color:var(--text-muted,#64748b); }
    .me-meta span { display:flex; align-items:center; gap:5px; }

    .me-resultat { background:var(--bg,#f0fdf4); border-radius:10px; padding:12px 14px;
      border:1px solid #bbf7d0; }
    .me-resultat-head { font-size:12px; font-weight:800; color:#15803d; margin-bottom:4px;
      display:flex; align-items:center; gap:6px; }
    .me-resultat p { font-size:13px; color:var(--text,#0f172a); margin:0; line-height:1.5; }

    .me-fichier { font-size:12.5px; color:#0f6cbd; display:flex; align-items:center; gap:6px; }
    .me-fichier a { color:inherit; text-decoration:underline; }

    .me-badge { padding:4px 11px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .badge-demande             { background:#dbeafe; color:#1d4ed8; }
    .badge-en_cours            { background:#fff7ed; color:#c2410c; }
    .badge-resultat_disponible { background:#dcfce7; color:#15803d; }
    .badge-annule              { background:#f1f5f9; color:#64748b; }
  `]
})
export class MesExamensComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) { this.loading = false; return; }
    this.api.patientByUser(uid).pipe(catchError(() => of(null))).subscribe(p => {
      if (p?.id) {
        this.api.examensPatient(p.id).subscribe({ next: d => { this.items = d; this.loading = false; }, error: () => this.loading = false });
      } else { this.loading = false; }
    });
  }

  badgeClass(s: string): string { return 'me-badge badge-' + (s || '').toLowerCase(); }
  bandClass(s: string): string  { return 'me-item-band band-' + (s || '').toLowerCase(); }
  statutLabel(s: string): string {
    const m: Record<string,string> = { DEMANDE:'Demandé', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Résultat dispo.', ANNULE:'Annulé' };
    return m[s] ?? s;
  }
}
