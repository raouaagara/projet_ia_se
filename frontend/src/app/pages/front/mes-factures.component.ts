import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-mes-factures',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, DatePipe],
  template: `
    <div class="mf-page">

      <div class="mf-header">
        <div>
          <h2 class="mf-title"><i class="fa fa-file-invoice-dollar"></i> Mes factures</h2>
          <p class="mf-sub">Historique de vos paiements et factures</p>
        </div>
        <div class="mf-summary" *ngIf="items.length > 0">
          <div class="mf-sum-box">
            <span class="mf-sum-v">{{ totalPaye() | number:'1.0-0' }} €</span>
            <span class="mf-sum-l">Total payé</span>
          </div>
          <div class="mf-sum-box">
            <span class="mf-sum-v">{{ totalDu() | number:'1.0-0' }} €</span>
            <span class="mf-sum-l">En attente</span>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="mf-skeletons" *ngIf="loading">
        <div class="mf-sk" *ngFor="let x of [1,2,3]"></div>
      </div>

      <!-- Vide -->
      <div class="mf-empty" *ngIf="!loading && items.length === 0">
        <div class="mf-empty-icon"><i class="fa fa-file-invoice-dollar"></i></div>
        <h3>Aucune facture</h3>
        <p>Vous n'avez pas encore de facture.</p>
      </div>

      <!-- Liste -->
      <div class="mf-list" *ngIf="!loading && items.length > 0">
        <div class="mf-item" *ngFor="let f of items">
          <div class="mf-item-band" [class]="bandClass(f.statut)">
            <span class="mf-day">{{ f.dateFacture | date:'dd' }}</span>
            <span class="mf-mon">{{ monthShort(f.dateFacture) }}</span>
          </div>
          <div class="mf-item-body">
            <div class="mf-item-top">
              <div>
                <span class="mf-num">{{ f.numeroFacture }}</span>
                <span class="mf-medecin" *ngIf="f.medecinNom"> · {{ f.medecinNom }}</span>
              </div>
              <span class="mf-badge" [class]="badgeClass(f.statut)">{{ statutLabel(f.statut) }}</span>
            </div>
            <div class="mf-amounts">
              <div class="mf-amount-row">
                <span class="mf-amount-l">Montant total</span>
                <span class="mf-amount-v">{{ f.montantTotal | number:'1.2-2' }} €</span>
              </div>
              <div class="mf-amount-row">
                <span class="mf-amount-l">Montant payé</span>
                <span class="mf-amount-v paid">{{ f.montantPaye | number:'1.2-2' }} €</span>
              </div>
              <div class="mf-amount-row" *ngIf="f.montantTotal - f.montantPaye > 0">
                <span class="mf-amount-l">Reste à payer</span>
                <span class="mf-amount-v due">{{ (f.montantTotal - f.montantPaye) | number:'1.2-2' }} €</span>
              </div>
            </div>
            <div class="mf-notes" *ngIf="f.notes">
              <i class="fa fa-circle-info"></i> {{ f.notes }}
            </div>
          </div>
          <button class="mf-pdf-btn" title="Télécharger" (click)="exportPdf(f)">
            <i class="fa fa-file-pdf"></i>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .mf-page { display:flex; flex-direction:column; gap:20px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .mf-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;
      background:linear-gradient(135deg,#0f6cbd,#00b389); border-radius:18px; padding:24px 28px; color:#fff; }
    .mf-title { font-size:22px; font-weight:900; margin:0 0 6px;
      display:flex; align-items:center; gap:10px; }
    .mf-sub { font-size:13px; color:rgba(255,255,255,.75); margin:0; }
    .mf-summary { display:flex; gap:16px; }
    .mf-sum-box { background:rgba(255,255,255,.2); border-radius:12px; padding:12px 18px; text-align:center; }
    .mf-sum-v { display:block; font-size:20px; font-weight:900; color:#fff; }
    .mf-sum-l { display:block; font-size:11.5px; color:rgba(255,255,255,.75); margin-top:2px; }

    .mf-skeletons { display:flex; flex-direction:column; gap:12px; }
    .mf-sk { height:100px; border-radius:14px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; }

    .mf-empty { text-align:center; padding:60px 24px; background:var(--surface,#fff);
      border-radius:18px; border:1.5px solid var(--border,#e2e8f0); }
    .mf-empty-icon { width:80px; height:80px; border-radius:50%; margin:0 auto 20px;
      background:linear-gradient(135deg,#f0f9ff,#dbeafe);
      display:flex; align-items:center; justify-content:center; font-size:32px; color:#0f6cbd; }
    .mf-empty h3 { font-size:18px; font-weight:800; color:var(--text,#0f172a); margin:0 0 8px; }
    .mf-empty p  { font-size:13px; color:var(--text-muted,#64748b); margin:0; }

    .mf-list { display:flex; flex-direction:column; gap:12px; }
    .mf-item { display:flex; align-items:stretch; background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid var(--border,#e2e8f0); overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .2s; }
    .mf-item:hover { transform:translateY(-2px); }

    .mf-item-band { width:68px; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:2px; padding:14px 8px; flex-shrink:0; }
    .band-paye           { background:linear-gradient(160deg,#22c55e,#00b389); }
    .band-en_attente     { background:linear-gradient(160deg,#f59e0b,#f97316); }
    .band-partiellement_paye { background:linear-gradient(160deg,#3b82f6,#0f6cbd); }
    .band-rembourse      { background:linear-gradient(160deg,#9333ea,#7e22ce); }
    .band-annule         { background:linear-gradient(160deg,#94a3b8,#64748b); }
    .mf-day { font-size:22px; font-weight:900; color:#fff; line-height:1; }
    .mf-mon { font-size:10px; font-weight:700; color:rgba(255,255,255,.85); text-transform:uppercase; }

    .mf-item-body { flex:1; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
    .mf-item-top  { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .mf-num { font-size:13px; font-weight:800; color:#0f6cbd; }
    .mf-medecin { font-size:13px; color:var(--text-muted,#64748b); }

    .mf-amounts { display:flex; flex-direction:column; gap:4px; }
    .mf-amount-row { display:flex; justify-content:space-between; align-items:center; }
    .mf-amount-l { font-size:12.5px; color:var(--text-muted,#64748b); }
    .mf-amount-v { font-size:13.5px; font-weight:700; color:var(--text,#0f172a); }
    .mf-amount-v.paid { color:#15803d; }
    .mf-amount-v.due  { color:#dc2626; }
    .mf-notes { font-size:12px; color:var(--text-muted,#64748b); display:flex; align-items:center; gap:6px; }
    .mf-notes i { color:#0f6cbd; }

    .mf-badge { padding:4px 11px; border-radius:6px; font-size:11.5px; font-weight:700; flex-shrink:0; }
    .badge-paye           { background:#dcfce7; color:#15803d; }
    .badge-en_attente     { background:#fef9c3; color:#854d0e; }
    .badge-partiellement_paye { background:#dbeafe; color:#1d4ed8; }
    .badge-rembourse      { background:#f3e8ff; color:#7e22ce; }
    .badge-annule         { background:#f1f5f9; color:#64748b; }

    .mf-pdf-btn { background:none; border:none; cursor:pointer; color:var(--text-muted,#94a3b8);
      font-size:18px; padding:16px 14px; transition:color .15s; flex-shrink:0; }
    .mf-pdf-btn:hover { color:#ef4444; }
  `]
})
export class MesFacturesComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const uid = this.auth.current()?.id;
    if (!uid) { this.loading = false; return; }
    this.api.patientByUser(uid).pipe(catchError(() => of(null))).subscribe(p => {
      if (p?.id) {
        this.api.facturesPatient(p.id).subscribe({
          next: d => { this.items = d; this.loading = false; },
          error: () => this.loading = false
        });
      } else { this.loading = false; }
    });
  }

  totalPaye(): number { return this.items.filter(f => f.statut === 'PAYE').reduce((s,f) => s + (f.montantPaye||0), 0); }
  totalDu():   number { return this.items.filter(f => f.statut === 'EN_ATTENTE').reduce((s,f) => s + (f.montantTotal - f.montantPaye), 0); }

  exportPdf(f: any): void {
    const txt = `FACTURE N° ${f.numeroFacture}\nDate : ${f.dateFacture}\nMédecin : ${f.medecinNom||'N/A'}\nTotal : ${f.montantTotal} €\nPayé : ${f.montantPaye} €\nStatut : ${this.statutLabel(f.statut)}`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `facture-${f.numeroFacture}.txt`; a.click();
  }

  monthShort(d: string): string {
    if (!d) return '';
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return months[new Date(d).getMonth()] ?? '';
  }

  badgeClass(s: string): string { return 'mf-badge badge-' + (s||'').toLowerCase(); }
  bandClass(s: string):  string { return 'mf-item-band band-' + (s||'').toLowerCase(); }
  statutLabel(s: string): string {
    const m: Record<string,string> = { EN_ATTENTE:'En attente', PAYE:'Payé', PARTIELLEMENT_PAYE:'Partiel', REMBOURSE:'Remboursé', ANNULE:'Annulé' };
    return m[s] ?? s;
  }
}
