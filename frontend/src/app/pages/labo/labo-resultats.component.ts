import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-labo-resultats',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  template: `
    <div class="lr-page">

      <div class="lr-header">
        <h2 class="lr-title"><i class="fa fa-circle-check"></i> Résultats publiés</h2>
        <p class="lr-sub">{{ items.length }} résultat(s) disponibles</p>
      </div>

      <div class="lr-empty" *ngIf="items.length === 0">
        <i class="fa fa-circle-check"></i>
        <p>Aucun résultat publié pour le moment</p>
      </div>

      <div class="lr-list" *ngIf="items.length > 0">
        <div class="lr-card" *ngFor="let e of items">
          <div class="lr-card-head">
            <span class="lr-type">{{ e.typeExamen }}</span>
            <span class="lr-date"><i class="fa fa-calendar-check"></i> {{ e.dateResultat | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="lr-people">
            <div class="lr-person">
              <div class="lr-av green">{{ e.patientNom?.charAt(0) }}</div>
              <div><small>Patient</small><span>{{ e.patientNom }}</span></div>
            </div>
            <div class="lr-sep">→</div>
            <div class="lr-person">
              <div class="lr-av blue">{{ e.medecinNom?.charAt(3) }}</div>
              <div><small>Médecin</small><span>{{ e.medecinNom }}</span></div>
            </div>
          </div>
          <div class="lr-resultat">
            <div class="lr-resultat-head"><i class="fa fa-microscope"></i> Résultat</div>
            <pre>{{ e.resultatTexte }}</pre>
            <div class="lr-fichier" *ngIf="e.fichierResultat">
              <i class="fa fa-paperclip"></i> {{ e.fichierResultat }}
            </div>
          </div>
          <div class="lr-notif-sent">
            <i class="fa fa-bell-ring"></i>
            Notifications envoyées au patient et au médecin
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .lr-page { display:flex; flex-direction:column; gap:18px; animation:fadeUp .4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    .lr-header { background:linear-gradient(135deg,#22c55e,#00b389); border-radius:16px;
      padding:22px 26px; color:#fff; }
    .lr-title { font-size:20px; font-weight:900; margin:0 0 5px;
      display:flex; align-items:center; gap:10px; }
    .lr-sub { font-size:13px; color:rgba(255,255,255,.8); margin:0; }

    .lr-empty { text-align:center; padding:50px; background:var(--surface,#fff);
      border-radius:14px; border:1.5px solid var(--border,#e2e8f0); color:var(--text-muted,#94a3b8); }
    .lr-empty i { font-size:32px; display:block; margin-bottom:10px; color:#bbf7d0; }
    .lr-empty p { margin:0; font-size:13px; }

    .lr-list { display:flex; flex-direction:column; gap:14px; }
    .lr-card { background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid #bbf7d0; padding:20px; display:flex; flex-direction:column; gap:12px;
      box-shadow:0 2px 8px rgba(34,197,94,.08); }

    .lr-card-head { display:flex; align-items:center; justify-content:space-between; }
    .lr-type { font-size:15px; font-weight:900; color:var(--text,#0f172a); }
    .lr-date { font-size:12.5px; color:var(--text-muted,#64748b); display:flex; align-items:center; gap:5px; }

    .lr-people { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .lr-person { display:flex; align-items:center; gap:8px; }
    .lr-av { width:34px; height:34px; border-radius:10px; font-size:12px; font-weight:800;
      color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .lr-av.green { background:linear-gradient(135deg,#22c55e,#00b389); }
    .lr-av.blue  { background:linear-gradient(135deg,#0f6cbd,#4338ca); }
    .lr-person small { display:block; font-size:10px; color:var(--text-muted,#94a3b8); text-transform:uppercase; }
    .lr-person span  { display:block; font-size:13px; font-weight:700; color:var(--text,#0f172a); }
    .lr-sep { color:#d1d5db; font-size:16px; }

    .lr-resultat { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:14px 16px; }
    .lr-resultat-head { font-size:12px; font-weight:800; color:#15803d; margin-bottom:8px;
      display:flex; align-items:center; gap:6px; }
    .lr-resultat pre { font-size:12.5px; color:var(--text,#0f172a); margin:0;
      white-space:pre-wrap; font-family:monospace; line-height:1.6; }
    .lr-fichier { margin-top:8px; font-size:12px; color:#0f6cbd; display:flex; align-items:center; gap:5px; }

    .lr-notif-sent { display:flex; align-items:center; gap:8px; font-size:12px;
      color:#15803d; background:#dcfce7; border-radius:8px; padding:8px 12px; font-weight:600; }
    .lr-notif-sent i { font-size:13px; }
  `]
})
export class LaboResultatsComponent implements OnInit {
  items: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.examens().subscribe(d => {
      this.items = d.filter((e: any) => e.statut === 'RESULTAT_DISPONIBLE')
                    .sort((a: any, b: any) => (b.dateResultat ?? '').localeCompare(a.dateResultat ?? ''));
    });
  }
}
