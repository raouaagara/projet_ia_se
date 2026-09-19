import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

interface CalDay { date: Date; otherMonth: boolean; rdvs: any[]; }

@Component({
  selector: 'app-plannings',
  standalone: true,
  imports: [NgFor, NgIf, SlicePipe],
  template: `
    <div class="pl-page">

      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="pl-header">
        <div>
          <h2 class="pl-title"><i class="fa fa-calendar-days"></i>
            {{ isMedecin ? 'Mon planning' : 'Planning clinique' }}
          </h2>
          <p class="pl-sub">{{ rdvs.length }} rendez-vous au total</p>
        </div>

        <!-- Filtre médecin (admin) -->
        <div class="pl-filters" *ngIf="!isMedecin">
          <select class="pl-select" (change)="onFilterChange($event)">
            <option value="">Tous les médecins</option>
            <option *ngFor="let m of medecins" [value]="m.id">Dr {{ m.prenom }} {{ m.nom }}</option>
          </select>
        </div>

        <!-- Médecin info -->
        <div class="pl-medecin-chip" *ngIf="isMedecin && medecinInfo">
          <div class="pl-med-av">{{ medecinInfo.prenom?.charAt(0) }}{{ medecinInfo.nom?.charAt(0) }}</div>
          <div>
            <span class="pl-med-name">Dr {{ medecinInfo.prenom }} {{ medecinInfo.nom }}</span>
            <span class="pl-med-spec">{{ medecinInfo.specialite }}</span>
          </div>
          <span class="pl-dispo" [class.dispo-yes]="medecinInfo.disponible" [class.dispo-no]="!medecinInfo.disponible">
            {{ medecinInfo.disponible ? 'Disponible' : 'Indisponible' }}
          </span>
        </div>

        <!-- Vue switcher -->
        <div class="pl-view-switch">
          <button [class.active]="view==='calendar'" (click)="view='calendar'">
            <i class="fa fa-calendar-days"></i> Calendrier
          </button>
          <button [class.active]="view==='list'" (click)="view='list'">
            <i class="fa fa-list"></i> Liste
          </button>
        </div>
      </div>

      <!-- ══════════════ VUE CALENDRIER ══════════════ -->
      <div class="pl-calendar" *ngIf="view==='calendar'">

        <!-- Navigation mois -->
        <div class="cal-nav">
          <button class="cal-nav-btn" (click)="prevMonth()"><i class="fa fa-chevron-left"></i></button>
          <div class="cal-month-title">
            {{ monthName() }} {{ currentYear }}
            <span class="cal-total-badge">{{ rdvsThisMonth() }} RDV ce mois</span>
          </div>
          <button class="cal-nav-btn" (click)="nextMonth()"><i class="fa fa-chevron-right"></i></button>
          <button class="cal-today-btn" (click)="goToday()">Aujourd'hui</button>
        </div>

        <!-- Jours de semaine -->
        <div class="cal-weekdays">
          <div *ngFor="let d of weekdays">{{ d }}</div>
        </div>

        <!-- Grille -->
        <div class="cal-grid">
          <div
            class="cal-day"
            *ngFor="let d of calDays"
            [class.other-month]="d.otherMonth"
            [class.today]="isToday(d.date)"
            [class.has-rdv]="d.rdvs.length > 0"
            (click)="selectDay(d)"
            [class.selected]="selectedDay && isSameDay(d.date, selectedDay.date)"
          >
            <span class="cal-day-num">{{ d.date.getDate() }}</span>

            <!-- RDV dots / pills -->
            <div class="cal-rdv-pills" *ngIf="d.rdvs.length > 0">
              <div class="cal-rdv-pill"
                *ngFor="let r of d.rdvs | slice:0:3"
                [class]="'pill-' + statusClass(r.statut)"
                [title]="r.patientNom + ' — ' + (r.dateHeure | slice:11:16)"
              >
                <span class="pill-time">{{ r.dateHeure | slice:11:16 }}</span>
                <span class="pill-name">{{ r.patientNom?.split(' ')[0] }}</span>
              </div>
              <div class="cal-more" *ngIf="d.rdvs.length > 3">+{{ d.rdvs.length - 3 }}</div>
            </div>
          </div>
        </div>

        <!-- Détail du jour sélectionné -->
        <div class="cal-detail" *ngIf="selectedDay && selectedDay.rdvs.length > 0">
          <div class="cal-detail-head">
            <i class="fa fa-calendar-check"></i>
            Rendez-vous du {{ formatDate(selectedDay.date) }}
            <span class="cal-detail-count">{{ selectedDay.rdvs.length }}</span>
          </div>
          <div class="cal-detail-list">
            <div class="cal-detail-row" *ngFor="let r of selectedDay.rdvs">
              <div class="cal-detail-time">{{ r.dateHeure | slice:11:16 }}</div>
              <div class="cal-detail-patient">
                <div class="cal-detail-name">{{ r.patientNom }}</div>
                <div class="cal-detail-motif">{{ r.motif || 'Aucun motif' }}</div>
              </div>
              <div class="cal-detail-medecin" *ngIf="!isMedecin">{{ r.medecinNom }}</div>
              <span class="cal-detail-badge" [class]="'badge-' + statusClass(r.statut)">{{ r.statut }}</span>
            </div>
          </div>
        </div>
        <div class="cal-empty-day" *ngIf="selectedDay && selectedDay.rdvs.length === 0">
          <i class="fa fa-calendar-xmark"></i> Aucun rendez-vous ce jour
        </div>
      </div>

      <!-- ══════════════ VUE LISTE ══════════════ -->
      <div class="pl-list" *ngIf="view==='list'">
        <div class="pl-list-head">
          <div>Date</div>
          <div>Patient</div>
          <div *ngIf="!isMedecin">Médecin</div>
          <div>Motif</div>
          <div>Statut</div>
        </div>
        <div class="pl-list-row" *ngFor="let r of rdvs">
          <div class="pl-list-date">
            <span class="pl-date-d">{{ r.dateHeure | slice:8:10 }}/{{ r.dateHeure | slice:5:7 }}</span>
            <span class="pl-date-t">{{ r.dateHeure | slice:11:16 }}</span>
          </div>
          <div class="pl-list-patient">
            <div class="pl-patient-av">{{ r.patientNom?.charAt(0) }}</div>
            {{ r.patientNom }}
          </div>
          <div *ngIf="!isMedecin" class="pl-list-med">{{ r.medecinNom }}</div>
          <div class="pl-list-motif">{{ r.motif || '—' }}</div>
          <div>
            <span class="pl-badge" [class]="'pl-badge-' + statusClass(r.statut)">{{ r.statut }}</span>
          </div>
        </div>
        <div class="pl-empty" *ngIf="rdvs.length === 0">
          <i class="fa fa-calendar-xmark"></i><p>Aucun rendez-vous</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .pl-page { display:flex; flex-direction:column; gap:20px; }

    /* ── HEADER ────────────────────────── */
    .pl-header { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
    .pl-title { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 2px; }
    .pl-title i { color:#0f6cbd; margin-right:8px; }
    .pl-sub { font-size:13px; color:var(--text-muted,#64748b); margin:0; }

    .pl-filters { margin-left:auto; }
    .pl-select {
      padding:8px 14px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text,#0f172a); font-size:13.5px; cursor:pointer;
      outline:none;
    }

    .pl-medecin-chip {
      display:flex; align-items:center; gap:10px;
      background:var(--surface,#fff); border:1.5px solid var(--border,#e2e8f0);
      border-radius:12px; padding:8px 14px; margin-left:auto;
    }
    .pl-med-av {
      width:34px; height:34px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .pl-med-name { display:block; font-size:13px; font-weight:700; color:var(--text,#0f172a); }
    .pl-med-spec { display:block; font-size:11px; color:var(--text-muted,#94a3b8); }
    .pl-dispo { padding:3px 10px; border-radius:999px; font-size:11.5px; font-weight:700; }
    .dispo-yes { background:#dcfce7; color:#16a34a; }
    .dispo-no  { background:#fee2e2; color:#dc2626; }

    .pl-view-switch {
      display:flex; gap:4px; background:var(--bg,#f0f4f8);
      border-radius:10px; padding:4px;
    }
    .pl-view-switch button {
      display:flex; align-items:center; gap:6px;
      padding:7px 14px; border-radius:8px; border:none; cursor:pointer;
      font-size:13px; font-weight:600; color:var(--text-muted,#64748b);
      background:transparent; transition:all .18s;
    }
    .pl-view-switch button.active { background:var(--surface,#fff); color:#0f6cbd; box-shadow:0 1px 4px rgba(0,0,0,.1); }

    /* ══════════════ CALENDRIER ══════════════ */
    .pl-calendar {
      background:var(--surface,#fff); border-radius:18px;
      border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 2px 12px rgba(0,0,0,.06); overflow:hidden;
    }

    .cal-nav {
      display:flex; align-items:center; gap:12px;
      padding:16px 20px; border-bottom:1.5px solid var(--border,#e2e8f0);
    }
    .cal-nav-btn {
      width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); cursor:pointer; color:var(--text-muted,#64748b);
      display:flex; align-items:center; justify-content:center; font-size:12px; transition:all .2s;
    }
    .cal-nav-btn:hover { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }
    .cal-month-title {
      font-size:17px; font-weight:800; color:var(--text,#0f172a);
      display:flex; align-items:center; gap:10px; flex:1; justify-content:center;
    }
    .cal-total-badge {
      font-size:11.5px; font-weight:600; color:#0f6cbd;
      background:#e8f4ff; padding:3px 10px; border-radius:999px;
    }
    .cal-today-btn {
      padding:6px 14px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); cursor:pointer; font-size:12.5px; font-weight:700;
      color:var(--text-muted,#64748b); transition:all .2s;
    }
    .cal-today-btn:hover { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }

    .cal-weekdays {
      display:grid; grid-template-columns:repeat(7,1fr);
      border-bottom:1.5px solid var(--border,#e2e8f0);
    }
    .cal-weekdays div {
      padding:10px 8px; text-align:center;
      font-size:11.5px; font-weight:800; text-transform:uppercase;
      letter-spacing:.06em; color:var(--text-muted,#94a3b8);
    }

    .cal-grid {
      display:grid; grid-template-columns:repeat(7,1fr);
    }
    .cal-day {
      min-height:100px; padding:8px; border-right:1px solid var(--border,#f1f5f9);
      border-bottom:1px solid var(--border,#f1f5f9);
      cursor:pointer; transition:background .15s; position:relative;
    }
    .cal-day:nth-child(7n) { border-right:none; }
    .cal-day:hover { background:var(--bg,#f8fafc); }
    .cal-day.other-month { opacity:.35; }
    .cal-day.today .cal-day-num {
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    }
    .cal-day.selected { background:#e8f4ff !important; }
    .cal-day.has-rdv { background:var(--bg,#fafbff); }

    .cal-day-num {
      font-size:13px; font-weight:700; color:var(--text,#0f172a);
      margin-bottom:5px; display:inline-flex; align-items:center; justify-content:center;
      min-width:26px; height:26px;
    }

    .cal-rdv-pills { display:flex; flex-direction:column; gap:2px; }
    .cal-rdv-pill {
      display:flex; align-items:center; gap:4px;
      padding:2px 6px; border-radius:4px; font-size:10.5px; font-weight:600;
      overflow:hidden; white-space:nowrap;
    }
    .pill-planifie  { background:#dbeafe; color:#1d4ed8; }
    .pill-confirme  { background:#dcfce7; color:#15803d; }
    .pill-annule    { background:#fee2e2; color:#b91c1c; }
    .pill-termine   { background:#f1f5f9; color:#64748b; }
    .pill-time { font-size:9.5px; opacity:.8; }
    .pill-name { overflow:hidden; text-overflow:ellipsis; }
    .cal-more {
      font-size:10.5px; color:var(--text-muted,#94a3b8); font-weight:700;
      padding-left:6px;
    }

    /* Détail */
    .cal-detail {
      border-top:1.5px solid var(--border,#e2e8f0);
      padding:16px 20px;
    }
    .cal-detail-head {
      display:flex; align-items:center; gap:10px; margin-bottom:14px;
      font-size:14px; font-weight:700; color:var(--text,#0f172a);
    }
    .cal-detail-head i { color:#0f6cbd; }
    .cal-detail-count {
      background:#e8f4ff; color:#0f6cbd;
      padding:2px 10px; border-radius:999px; font-size:12px;
    }
    .cal-detail-list { display:flex; flex-direction:column; gap:8px; }
    .cal-detail-row {
      display:flex; align-items:center; gap:14px;
      padding:10px 14px; border-radius:10px;
      background:var(--bg,#f8fafc); border:1px solid var(--border,#f1f5f9);
    }
    .cal-detail-time {
      font-size:14px; font-weight:800; color:#0f6cbd;
      min-width:44px; flex-shrink:0;
    }
    .cal-detail-name  { font-size:13.5px; font-weight:700; color:var(--text,#0f172a); }
    .cal-detail-motif { font-size:12px; color:var(--text-muted,#94a3b8); margin-top:1px; }
    .cal-detail-medecin { font-size:12.5px; color:var(--text-muted,#64748b); flex:1; }
    .cal-detail-badge {
      padding:3px 10px; border-radius:6px; font-size:11.5px; font-weight:700; margin-left:auto;
    }
    .badge-planifie  { background:#dbeafe; color:#1d4ed8; }
    .badge-confirme  { background:#dcfce7; color:#15803d; }
    .badge-annule    { background:#fee2e2; color:#b91c1c; }
    .badge-termine   { background:#f1f5f9; color:#64748b; }

    .cal-empty-day {
      border-top:1.5px solid var(--border,#e2e8f0); padding:20px;
      text-align:center; color:var(--text-muted,#94a3b8); font-size:13.5px;
    }
    .cal-empty-day i { margin-right:8px; }

    /* ══════════════ LISTE ══════════════ */
    .pl-list {
      background:var(--surface,#fff); border-radius:16px;
      border:1.5px solid var(--border,#e2e8f0); overflow:hidden;
    }
    .pl-list-head {
      display:grid; grid-template-columns:100px 1fr 1fr 1fr 120px;
      padding:12px 16px; background:var(--bg,#f8fafc);
      border-bottom:1.5px solid var(--border,#e2e8f0);
      font-size:11px; font-weight:800; text-transform:uppercase;
      letter-spacing:.06em; color:var(--text-muted,#94a3b8); gap:8px;
    }
    .pl-list-row {
      display:grid; grid-template-columns:100px 1fr 1fr 1fr 120px;
      padding:12px 16px; gap:8px; align-items:center;
      border-bottom:1px solid var(--border,#f1f5f9); transition:background .15s;
    }
    .pl-list-row:last-child { border-bottom:none; }
    .pl-list-row:hover { background:var(--bg,#f8fafc); }
    .pl-date-d { display:block; font-size:13px; font-weight:700; color:var(--text,#0f172a); }
    .pl-date-t { display:block; font-size:11.5px; color:#0f6cbd; font-weight:600; }
    .pl-list-patient { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--text,#0f172a); }
    .pl-patient-av {
      width:28px; height:28px; border-radius:8px; flex-shrink:0;
      background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff;
      font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .pl-list-med   { font-size:13px; color:var(--text-muted,#64748b); }
    .pl-list-motif { font-size:12.5px; color:var(--text-muted,#64748b); }
    .pl-badge { padding:3px 10px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .pl-badge-planifie  { background:#dbeafe; color:#1d4ed8; }
    .pl-badge-confirme  { background:#dcfce7; color:#15803d; }
    .pl-badge-annule    { background:#fee2e2; color:#b91c1c; }
    .pl-badge-termine   { background:#f1f5f9; color:#64748b; }

    .pl-empty { text-align:center; padding:48px; color:var(--text-muted,#94a3b8); }
    .pl-empty i { font-size:32px; margin-bottom:12px; display:block; }
  `]
})
export class PlanningsComponent implements OnInit {
  medecins: any[] = [];
  rdvs: any[] = [];
  isMedecin = false;
  medecinInfo?: any;
  view: 'calendar' | 'list' = 'calendar';
  selectedDay?: CalDay;

  weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  currentMonth: number;
  currentYear: number;
  calDays: CalDay[] = [];

  private months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  constructor(private api: ApiService, private auth: AuthService) {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
  }

  ngOnInit(): void {
    this.isMedecin = this.auth.role() === 'MEDECIN';
    if (this.isMedecin) {
      const uid = this.auth.current()?.id;
      if (!uid) return;
      this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
        if (m) { this.medecinInfo = m; this.api.rdvsMedecin(m.id).subscribe(r => { this.rdvs = r; this.buildCalendar(); }); }
      });
    } else {
      this.api.medecins().subscribe(m => this.medecins = m);
      this.api.rdvs().subscribe(r => { this.rdvs = r; this.buildCalendar(); });
    }
  }

  onFilterChange(e: Event): void {
    const id = +(e.target as HTMLSelectElement).value;
    const obs = id ? this.api.rdvsMedecin(id) : this.api.rdvs();
    obs.subscribe(r => { this.rdvs = r; this.buildCalendar(); });
  }

  buildCalendar(): void {
    const days: CalDay[] = [];
    const first = new Date(this.currentYear, this.currentMonth, 1);
    // Start on Monday
    let start = new Date(first);
    const dow = (first.getDay() + 6) % 7; // 0=Mon
    start.setDate(start.getDate() - dow);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const rdvs = this.rdvsForDay(d);
      days.push({ date: d, otherMonth: d.getMonth() !== this.currentMonth, rdvs });
    }
    this.calDays = days;
    this.selectedDay = undefined;
  }

  rdvsForDay(d: Date): any[] {
    const ds = this.toDateStr(d);
    return this.rdvs.filter(r => r.dateHeure?.startsWith(ds))
      .sort((a,b) => a.dateHeure.localeCompare(b.dateHeure));
  }

  toDateStr(d: Date): string {
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }

  rdvsThisMonth(): number {
    return this.calDays.filter(d => !d.otherMonth).reduce((s,d) => s + d.rdvs.length, 0);
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.buildCalendar();
  }
  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.buildCalendar();
  }
  goToday(): void {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
    this.buildCalendar();
  }

  isToday(d: Date): boolean {
    const n = new Date();
    return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }
  isSameDay(a: Date, b: Date): boolean {
    return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();
  }
  selectDay(d: CalDay): void { this.selectedDay = d; }
  monthName(): string { return this.months[this.currentMonth]; }
  formatDate(d: Date): string { return d.getDate() + ' ' + this.months[d.getMonth()] + ' ' + d.getFullYear(); }
  statusClass(s: string): string { return (s||'').toLowerCase(); }
}
