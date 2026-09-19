import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [NgFor, NgIf, SlicePipe],
  template: `
    <div class="hist">

      <!-- ── STATS BAND ──────────────────────────────── -->
      <div class="hist-band">
        <div class="hist-stat reveal" style="animation-delay:.0s">
          <div class="hst-icon" style="background:linear-gradient(135deg,#6366f1,#a855f7)">
            <i class="fa fa-stethoscope"></i>
          </div>
          <div>
            <div class="hst-v">{{ consultations.length }}</div>
            <div class="hst-l">Consultations</div>
          </div>
        </div>
        <div class="hist-sep"></div>
        <div class="hist-stat reveal" style="animation-delay:.1s">
          <div class="hst-icon" style="background:linear-gradient(135deg,#00b389,#22c55e)">
            <i class="fa fa-prescription"></i>
          </div>
          <div>
            <div class="hst-v">{{ ordonnances.length }}</div>
            <div class="hst-l">Ordonnances</div>
          </div>
        </div>
        <div class="hist-sep"></div>
        <div class="hist-stat reveal" style="animation-delay:.2s">
          <div class="hst-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">
            <i class="fa fa-calendar-check"></i>
          </div>
          <div>
            <div class="hst-v">{{ consultations.length + ordonnances.length }}</div>
            <div class="hst-l">Actes total</div>
          </div>
        </div>
      </div>

      <!-- ── TABS ─────────────────────────────────────── -->
      <div class="hist-tabs reveal">
        <button [class.hist-tab-active]="tab==='consultations'" (click)="tab='consultations'">
          <i class="fa fa-stethoscope"></i>
          Consultations
          <span class="htc" [class.htc-active]="tab==='consultations'">{{ consultations.length }}</span>
        </button>
        <button [class.hist-tab-active]="tab==='ordonnances'" (click)="tab='ordonnances'">
          <i class="fa fa-prescription"></i>
          Ordonnances
          <span class="htc" [class.htc-active]="tab==='ordonnances'">{{ ordonnances.length }}</span>
        </button>
      </div>

      <!-- Skeleton -->
      <div class="hist-skeletons" *ngIf="loading">
        <div class="hsk reveal" *ngFor="let x of [1,2,3]" [style.animation-delay]="x*0.08+'s'"></div>
      </div>

      <!-- ── CONSULTATIONS ──────────────────────────── -->
      <div *ngIf="tab==='consultations' && !loading">
        <div class="hist-empty reveal" *ngIf="consultations.length===0">
          <div class="he-circle" style="background:linear-gradient(135deg,#f3e8ff,#e0e7ff)">
            <i class="fa fa-stethoscope" style="color:#6366f1"></i>
          </div>
          <h3>Aucune consultation</h3>
          <p>Vos consultations passées apparaîtront ici</p>
        </div>
        <div class="hist-list" *ngIf="consultations.length>0">
          <div class="hist-card reveal-item" *ngFor="let c of consultations; let i=index"
               [style.animation-delay]="i*0.07+'s'">
            <div class="hc-accent" style="background:linear-gradient(160deg,#6366f1,#a855f7)">
              <span class="hca-day">{{ c.dateConsultation | slice:8:10 }}</span>
              <span class="hca-mon">{{ monthShort(c.dateConsultation) }}</span>
              <span class="hca-yr">{{ c.dateConsultation | slice:0:4 }}</span>
            </div>
            <div class="hc-body">
              <div class="hc-top">
                <div class="hc-title">
                  <i class="fa fa-stethoscope" style="color:#6366f1"></i>
                  Consultation médicale
                </div>
                <span class="hc-badge" style="background:#f3e8ff;color:#7e22ce">Terminée</span>
              </div>
              <div class="hc-detail" *ngIf="c.diagnostic">
                <i class="fa fa-clipboard-list" style="color:#6366f1"></i>
                <span>{{ c.diagnostic }}</span>
              </div>
              <div class="hc-doc">
                <div class="hc-doc-av">{{ c.medecinNom?.charAt(3) }}</div>
                {{ c.medecinNom }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── ORDONNANCES ────────────────────────────── -->
      <div *ngIf="tab==='ordonnances' && !loading">
        <div class="hist-empty reveal" *ngIf="ordonnances.length===0">
          <div class="he-circle" style="background:linear-gradient(135deg,#e6faf5,#dcfce7)">
            <i class="fa fa-prescription" style="color:#00b389"></i>
          </div>
          <h3>Aucune ordonnance</h3>
          <p>Vos ordonnances apparaîtront ici après vos consultations</p>
        </div>
        <div class="hist-list" *ngIf="ordonnances.length>0">
          <div class="hist-card reveal-item" *ngFor="let o of ordonnances; let i=index"
               [style.animation-delay]="i*0.07+'s'">
            <div class="hc-accent" style="background:linear-gradient(160deg,#00b389,#22c55e)">
              <span class="hca-day">{{ o.dateEmission | slice:8:10 }}</span>
              <span class="hca-mon">{{ monthShort(o.dateEmission) }}</span>
              <span class="hca-yr">{{ o.dateEmission | slice:0:4 }}</span>
            </div>
            <div class="hc-body">
              <div class="hc-top">
                <div class="hc-title">
                  <i class="fa fa-prescription" style="color:#00b389"></i>
                  Ordonnance médicale
                </div>
                <span class="hc-badge" style="background:#dcfce7;color:#15803d">Délivrée</span>
              </div>
              <div class="hc-detail" *ngIf="o.medicaments">
                <i class="fa fa-pills" style="color:#f59e0b"></i>
                <span>{{ o.medicaments }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .reveal      { animation: fadeUp .5s ease both; }
    .reveal-item { animation: fadeUp .48s ease both; }

    .hist { display:flex; flex-direction:column; gap:20px; max-width:860px; margin:0 auto; }

    /* Stats band */
    .hist-band {
      display:flex; align-items:center; gap:0;
      background:#fff; border-radius:18px; border:1.5px solid #e2e8f0;
      overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.05);
    }
    .hist-stat {
      flex:1; display:flex; align-items:center; gap:14px;
      padding:20px 24px; transition:background .18s;
    }
    .hist-stat:hover { background:#f8fafc; }
    .hist-sep { width:1px; height:48px; background:#f1f5f9; flex-shrink:0; }
    .hst-icon {
      width:46px; height:46px; border-radius:13px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:19px;
      box-shadow:0 4px 12px rgba(0,0,0,.12);
    }
    .hst-v { font-size:26px; font-weight:900; color:#0f172a; line-height:1; }
    .hst-l { font-size:12.5px; color:#94a3b8; font-weight:600; margin-top:3px; }

    /* Tabs */
    .hist-tabs {
      display:flex; gap:6px; background:#f1f5f9; border-radius:14px; padding:5px;
    }
    .hist-tabs button {
      flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
      padding:12px 16px; border-radius:10px; border:none; cursor:pointer;
      font-size:14px; font-weight:700; color:#64748b; background:transparent; transition:all .2s;
    }
    .hist-tab-active { background:#fff !important; color:#0f172a !important; box-shadow:0 2px 10px rgba(0,0,0,.08) !important; }
    .htc {
      min-width:22px; height:22px; border-radius:999px;
      background:#e2e8f0; color:#64748b; font-size:11px; font-weight:800;
      display:inline-flex; align-items:center; justify-content:center; padding:0 7px;
      transition:all .2s;
    }
    .htc-active { background:#0f6cbd; color:#fff; }

    /* Skeleton */
    .hist-skeletons { display:flex; flex-direction:column; gap:12px; }
    .hsk {
      height:90px; border-radius:16px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }

    /* Empty */
    .hist-empty { text-align:center; padding:52px 24px; }
    .he-circle {
      width:80px; height:80px; border-radius:50%; margin:0 auto 18px;
      display:flex; align-items:center; justify-content:center; font-size:32px;
    }
    .hist-empty h3 { font-size:18px; font-weight:800; color:#0f172a; margin:0 0 8px; }
    .hist-empty p  { font-size:14px; color:#64748b; margin:0; }

    /* List & cards */
    .hist-list { display:flex; flex-direction:column; gap:12px; }
    .hist-card {
      display:flex; align-items:stretch;
      background:#fff; border-radius:18px; overflow:hidden;
      border:1.5px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,.05);
      transition:all .22s;
    }
    .hist-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,0,0,.1); }

    .hc-accent {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      width:72px; flex-shrink:0; padding:14px 8px;
    }
    .hca-day { font-size:24px; font-weight:900; color:#fff; line-height:1; }
    .hca-mon { font-size:10px; font-weight:700; color:rgba(255,255,255,.85); text-transform:uppercase; margin-top:2px; }
    .hca-yr  { font-size:10px; color:rgba(255,255,255,.6); margin-top:2px; }

    .hc-body { flex:1; padding:16px 20px; display:flex; flex-direction:column; gap:8px; }
    .hc-top  { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .hc-title {
      display:flex; align-items:center; gap:8px;
      font-size:15px; font-weight:800; color:#0f172a;
    }
    .hc-badge { padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; }
    .hc-detail {
      display:flex; align-items:center; gap:7px;
      font-size:13.5px; color:#475569;
    }
    .hc-doc {
      display:flex; align-items:center; gap:8px;
      font-size:13.5px; font-weight:700; color:#0f172a;
    }
    .hc-doc-av {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff;
      font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
  `]
})
export class HistoriqueComponent implements OnInit, AfterViewInit {
  consultations: any[] = [];
  ordonnances:   any[] = [];
  loading = true;
  tab: 'consultations' | 'ordonnances' = 'consultations';

  constructor(private api: ApiService, private auth: AuthService, private el: ElementRef) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) return;
    this.api.patientByUser(uid).pipe(catchError(() => of(null))).subscribe(p => {
      if (!p) { this.loading = false; return; }
      this.api.consultationsPatient(p.id).subscribe(c => { this.consultations = c; this.loading = false; });
      this.api.ordonnancesPatient(p.id).subscribe(o => this.ordonnances = o);
    });
  }

  ngAfterViewInit(): void {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => this.el.nativeElement.querySelectorAll('.reveal,.reveal-item').forEach((el: Element) => obs.observe(el)), 100);
  }

  monthShort(d: string): string {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return d ? months[+d.slice(5, 7) - 1] ?? '' : '';
  }
}
