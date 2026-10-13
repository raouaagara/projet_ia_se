import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { ApiService }  from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

interface CalDay { date: Date; otherMonth: boolean; rdvs: any[]; }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [NgFor, NgIf, SlicePipe],
  template: `
  <div class="cal-page">

    <!-- ── HEADER ─────────────────────────────────────────── -->
    <div class="cal-header">
      <div>
        <h2 class="cal-title">
          <i class="fa fa-calendar-days"></i>
          {{ isMedecin ? 'Mon planning' : 'Planning clinique' }}
        </h2>
        <p class="cal-sub">
          {{ rdvsThisMonth() }} RDV ce mois · glisser-déposer pour reprogrammer
        </p>
      </div>
      <div class="cal-actions">
        <select class="cal-select" *ngIf="!isMedecin" (change)="onMedecinChange($event)">
          <option value="">Tous les médecins</option>
          <option *ngFor="let m of medecins" [value]="m.id">Dr {{ m.prenom }} {{ m.nom }}</option>
        </select>
        <div class="cal-nav">
          <button class="cal-nav-btn" (click)="prevMonth()"><i class="fa fa-chevron-left"></i></button>
          <span class="cal-month">{{ monthName() }} {{ currentYear }}</span>
          <button class="cal-nav-btn" (click)="nextMonth()"><i class="fa fa-chevron-right"></i></button>
          <button class="cal-today-btn" (click)="goToday()">Aujourd'hui</button>
        </div>
      </div>
    </div>

    <!-- ── LÉGENDE ────────────────────────────────────────── -->
    <div class="cal-legend">
      <span class="leg planifie"><span class="dot"></span>Planifié</span>
      <span class="leg confirme"><span class="dot"></span>Confirmé</span>
      <span class="leg termine"><span class="dot"></span>Terminé</span>
      <span class="leg annule"><span class="dot"></span>Annulé</span>
      <span class="cal-hint" *ngIf="isMedecin || isAdmin">
        <i class="fa fa-hand-pointer"></i> Glisser un RDV pour le déplacer
      </span>
    </div>

    <!-- ── GRILLE ─────────────────────────────────────────── -->
    <div class="cal-wrap">
      <!-- Jours de la semaine -->
      <div class="cal-weekdays">
        <div *ngFor="let d of weekDays" class="cal-weekday">{{ d }}</div>
      </div>

      <!-- Cellules du mois -->
      <div class="cal-grid">
        <div *ngFor="let day of calDays"
             class="cal-cell"
             [class.other-month]="day.otherMonth"
             [class.today]="isToday(day.date)"
             [class.selected]="selectedDay && isSameDay(day.date, selectedDay.date)"
             (click)="selectDay(day)"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event, day.date)">

          <div class="cal-date">{{ day.date.getDate() }}</div>

          <div class="cal-events">
            <div *ngFor="let r of day.rdvs | slice:0:3"
                 class="cal-event"
                 [class]="'cal-event ev-' + r.statut?.toLowerCase()"
                 draggable="true"
                 (dragstart)="onDragStart($event, r)"
                 (click)="openRdv(r, $event)"
                 [title]="r.patientNom + ' — ' + r.motif">
              <span class="ev-time">{{ r.dateHeure | slice:11:16 }}</span>
              <span class="ev-name">{{ r.patientNom?.split(' ')[0] }}</span>
            </div>
            <div *ngIf="day.rdvs.length > 3" class="cal-more">
              +{{ day.rdvs.length - 3 }} de plus
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PANEL JOUR SÉLECTIONNÉ ─────────────────────────── -->
    <div class="cal-day-panel" *ngIf="selectedDay && selectedDay.rdvs.length > 0">
      <div class="cal-dp-head">
        <i class="fa fa-calendar-day"></i>
        {{ formatDate(selectedDay.date) }}
        <span class="cal-dp-count">{{ selectedDay.rdvs.length }} RDV</span>
        <button class="cal-dp-close" (click)="selectedDay = undefined"><i class="fa fa-xmark"></i></button>
      </div>
      <div class="cal-dp-list">
        <div *ngFor="let r of selectedDay.rdvs" class="cal-dp-row" (click)="openRdv(r, $event)">
          <span class="cal-dp-time">{{ r.dateHeure | slice:11:16 }}</span>
          <span class="cal-dp-name">{{ r.patientNom }}</span>
          <span class="cal-dp-motif">{{ r.motif || '—' }}</span>
          <span class="cal-dp-badge" [class]="'badge-' + r.statut?.toLowerCase()">{{ r.statut }}</span>
        </div>
      </div>
    </div>

    <!-- ── MODAL RDV ──────────────────────────────────────── -->
    <div class="cal-overlay" *ngIf="selectedRdv" (click)="closeModal()"></div>
    <div class="cal-modal" *ngIf="selectedRdv">
      <div class="cal-modal-head">
        <i class="fa fa-calendar-check"></i>
        Détail du rendez-vous
        <button class="cal-modal-close" (click)="closeModal()"><i class="fa fa-xmark"></i></button>
      </div>
      <div class="cal-modal-body">
        <div class="cal-info-row"><i class="fa fa-user"></i>
          <div><div class="lbl">Patient</div><div class="val">{{ selectedRdv.patientNom }}</div></div>
        </div>
        <div class="cal-info-row"><i class="fa fa-user-doctor"></i>
          <div><div class="lbl">Médecin</div><div class="val">{{ selectedRdv.medecinNom }}</div></div>
        </div>
        <div class="cal-info-row"><i class="fa fa-clock"></i>
          <div><div class="lbl">Date & Heure</div><div class="val">{{ formatDatetime(selectedRdv.dateHeure) }}</div></div>
        </div>
        <div class="cal-info-row" *ngIf="selectedRdv.motif"><i class="fa fa-notes-medical"></i>
          <div><div class="lbl">Motif</div><div class="val">{{ selectedRdv.motif }}</div></div>
        </div>
        <div class="cal-info-row"><i class="fa fa-circle-dot"></i>
          <div>
            <div class="lbl">Statut</div>
            <span class="cal-dp-badge" [class]="'badge-' + selectedRdv.statut?.toLowerCase()">{{ selectedRdv.statut }}</span>
          </div>
        </div>
      </div>
      <div class="cal-modal-footer" *ngIf="canEdit()">
        <button class="cal-btn confirm" *ngIf="selectedRdv.statut==='PLANIFIE'" (click)="changeStatut('CONFIRME')">
          <i class="fa fa-check"></i> Confirmer
        </button>
        <button class="cal-btn annuler" *ngIf="selectedRdv.statut!=='ANNULE' && selectedRdv.statut!=='TERMINE'" (click)="changeStatut('ANNULE')">
          <i class="fa fa-ban"></i> Annuler
        </button>
        <button class="cal-btn terminer" *ngIf="selectedRdv.statut==='CONFIRME'" (click)="changeStatut('TERMINE')">
          <i class="fa fa-flag-checkered"></i> Terminer
        </button>
      </div>
    </div>

    <!-- ── TOAST ──────────────────────────────────────────── -->
    <div class="cal-toast" [class.show]="toast.show" [class]="'cal-toast ' + toast.type + (toast.show ? ' show' : '')">
      <i [class]="toast.icon"></i> {{ toast.msg }}
    </div>

  </div>
  `,
  styles: [`
    .cal-page { display:flex; flex-direction:column; gap:16px; }

    /* ── HEADER ──────────────────────────────────────────── */
    .cal-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
    .cal-title  { font-size:20px; font-weight:800; color:var(--text,#0f172a); margin:0 0 4px; }
    .cal-title i{ color:#0f6cbd; margin-right:8px; }
    .cal-sub    { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .cal-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .cal-select { padding:8px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0); background:var(--surface,#fff); font-size:13px; }
    .cal-nav    { display:flex; align-items:center; gap:6px; }
    .cal-nav-btn{ width:32px; height:32px; border-radius:8px; border:1.5px solid var(--border,#e2e8f0); background:var(--surface,#fff); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:all .15s; }
    .cal-nav-btn:hover { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }
    .cal-month  { font-size:15px; font-weight:800; color:var(--text,#0f172a); min-width:160px; text-align:center; }
    .cal-today-btn { padding:6px 14px; border-radius:8px; border:none; background:linear-gradient(135deg,#0f6cbd,#00b389); color:#fff; font-size:12.5px; font-weight:700; cursor:pointer; }

    /* ── LÉGENDE ──────────────────────────────────────────── */
    .cal-legend { display:flex; align-items:center; gap:14px; flex-wrap:wrap; font-size:12px; }
    .leg { display:flex; align-items:center; gap:5px; font-weight:600; }
    .leg .dot { width:10px; height:10px; border-radius:3px; display:inline-block; }
    .leg.planifie .dot { background:#3b82f6; }
    .leg.confirme .dot { background:#22c55e; }
    .leg.termine  .dot { background:#94a3b8; }
    .leg.annule   .dot { background:#ef4444; }
    .cal-hint { color:var(--text-muted,#94a3b8); margin-left:auto; font-size:11.5px; }
    .cal-hint i { margin-right:4px; }

    /* ── GRILLE ───────────────────────────────────────────── */
    .cal-wrap { background:var(--surface,#fff); border-radius:18px; border:1.5px solid var(--border,#e2e8f0); overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.05); }
    .cal-weekdays { display:grid; grid-template-columns:repeat(7,1fr); background:#f8fafc; border-bottom:1.5px solid var(--border,#e2e8f0); }
    .cal-weekday  { padding:10px 0; text-align:center; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted,#64748b); }
    .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); }
    .cal-cell {
      min-height:110px; padding:6px; border-right:1px solid var(--border,#f1f5f9); border-bottom:1px solid var(--border,#f1f5f9);
      cursor:pointer; transition:background .15s; position:relative;
    }
    .cal-cell:hover { background:var(--bg,#f8fafc); }
    .cal-cell.other-month { background:#fafafa; opacity:.5; }
    .cal-cell.today { background:rgba(15,108,189,.04); }
    .cal-cell.today .cal-date { background:#0f6cbd; color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; }
    .cal-cell.selected { background:rgba(0,179,137,.05); border-color:#00b389; }
    .cal-date  { font-size:13px; font-weight:700; color:var(--text,#0f172a); margin-bottom:4px; }
    .cal-events{ display:flex; flex-direction:column; gap:2px; }
    .cal-event {
      padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;
      display:flex; gap:4px; align-items:center; cursor:grab;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      transition:opacity .15s;
    }
    .cal-event:active { cursor:grabbing; opacity:.7; }
    .ev-planifie { background:#dbeafe; color:#1d4ed8; }
    .ev-confirme { background:#dcfce7; color:#15803d; }
    .ev-termine  { background:#f1f5f9; color:#64748b; }
    .ev-annule   { background:#fee2e2; color:#b91c1c; }
    .ev-time { font-weight:700; flex-shrink:0; }
    .ev-name { overflow:hidden; text-overflow:ellipsis; }
    .cal-more { font-size:10.5px; color:#0f6cbd; font-weight:700; padding:1px 4px; cursor:pointer; }

    /* ── PANEL JOUR ─────────────────────────────────────────  */
    .cal-day-panel {
      background:var(--surface,#fff); border-radius:14px; border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 2px 10px rgba(0,0,0,.05); overflow:hidden;
    }
    .cal-dp-head {
      display:flex; align-items:center; gap:10px; padding:12px 16px;
      background:linear-gradient(135deg,#f0f9ff,#e6faf5);
      font-size:14px; font-weight:800; color:#0f172a; border-bottom:1.5px solid #e2e8f0;
    }
    .cal-dp-head i { color:#0f6cbd; }
    .cal-dp-count { margin-left:4px; font-size:12px; background:#0f6cbd; color:#fff; padding:2px 8px; border-radius:999px; }
    .cal-dp-close { margin-left:auto; background:none; border:none; cursor:pointer; color:#94a3b8; font-size:15px; }
    .cal-dp-list  { display:flex; flex-direction:column; }
    .cal-dp-row   {
      display:flex; align-items:center; gap:12px; padding:10px 16px;
      border-bottom:1px solid var(--border,#f1f5f9); cursor:pointer; transition:background .15s;
    }
    .cal-dp-row:last-child { border-bottom:none; }
    .cal-dp-row:hover { background:var(--bg,#f8fafc); }
    .cal-dp-time  { font-size:13px; font-weight:800; color:#0f6cbd; min-width:42px; }
    .cal-dp-name  { font-size:13.5px; font-weight:700; color:var(--text,#0f172a); flex:1; }
    .cal-dp-motif { font-size:12px; color:var(--text-muted,#64748b); flex:1; }
    .cal-dp-badge { padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; flex-shrink:0; }
    .badge-planifie { background:#dbeafe; color:#1d4ed8; }
    .badge-confirme { background:#dcfce7; color:#15803d; }
    .badge-annule   { background:#fee2e2; color:#b91c1c; }
    .badge-termine  { background:#f1f5f9; color:#64748b; }

    /* ── MODAL ───────────────────────────────────────────── */
    .cal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:1100; backdrop-filter:blur(2px); }
    .cal-modal {
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      z-index:1101; width:420px; max-width:calc(100vw - 32px);
      background:var(--surface,#fff); border-radius:18px;
      box-shadow:0 20px 60px rgba(0,0,0,.2); overflow:hidden;
      animation:fadeModal .2s ease;
    }
    @keyframes fadeModal { from{opacity:0;transform:translate(-50%,-54%)} to{opacity:1;transform:translate(-50%,-50%)} }
    .cal-modal-head {
      display:flex; align-items:center; gap:10px; padding:16px 20px;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      color:#fff; font-size:15px; font-weight:800;
    }
    .cal-modal-close { margin-left:auto; background:rgba(255,255,255,.2); border:none; color:#fff; width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:14px; }
    .cal-modal-body  { padding:20px; display:flex; flex-direction:column; gap:14px; }
    .cal-info-row    { display:flex; align-items:flex-start; gap:12px; }
    .cal-info-row i  { color:#0f6cbd; font-size:16px; margin-top:2px; flex-shrink:0; }
    .lbl { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:2px; }
    .val { font-size:14px; font-weight:600; color:#0f172a; }
    .cal-modal-footer{ padding:14px 20px; border-top:1.5px solid #f1f5f9; display:flex; gap:10px; justify-content:flex-end; }
    .cal-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 16px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:700; transition:all .15s; }
    .cal-btn.confirm  { background:#dcfce7; color:#15803d; }
    .cal-btn.confirm:hover  { background:#15803d; color:#fff; }
    .cal-btn.annuler  { background:#fee2e2; color:#b91c1c; }
    .cal-btn.annuler:hover  { background:#b91c1c; color:#fff; }
    .cal-btn.terminer { background:#f1f5f9; color:#64748b; }
    .cal-btn.terminer:hover { background:#64748b; color:#fff; }

    /* ── TOAST ───────────────────────────────────────────── */
    .cal-toast {
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(20px);
      z-index:2000; padding:12px 24px; border-radius:12px; font-size:14px; font-weight:700;
      opacity:0; pointer-events:none; transition:all .3s ease;
      display:flex; align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,.15);
    }
    .cal-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
    .cal-toast.success { background:#dcfce7; color:#15803d; }
    .cal-toast.error   { background:#fee2e2; color:#b91c1c; }
    .cal-toast.info    { background:#dbeafe; color:#1d4ed8; }
  `]
})
export class CalendarComponent implements OnInit {

  isMedecin = false;
  isAdmin   = false;
  medecins: any[] = [];
  calDays:  CalDay[] = [];
  selectedDay?: CalDay;
  selectedRdv?: any;
  private allRdvs: any[] = [];
  private draggingRdv?: any;

  currentMonth = new Date().getMonth();
  currentYear  = new Date().getFullYear();

  toast = { show: false, type: 'success', icon: 'fa fa-check-circle', msg: '' };

  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  months   = ['Janvier','Février','Mars','Avril','Mai','Juin',
               'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.isMedecin = this.auth.role() === 'MEDECIN';
    this.isAdmin   = this.auth.role() === 'ADMIN';

    if (this.isMedecin) {
      const uid = this.auth.current()?.id;
      if (uid) {
        this.api.medecinByUser(uid).pipe(catchError(() => of(null))).subscribe(m => {
          if (m) this.api.rdvsMedecin(m.id).subscribe(r => { this.allRdvs = r; this.buildCalendar(); });
        });
      }
    } else {
      this.api.medecins().subscribe(m => this.medecins = m);
      this.api.rdvs().subscribe(r => { this.allRdvs = r; this.buildCalendar(); });
    }
  }

  // ── Calendrier ─────────────────────────────────────────────────────

  buildCalendar(): void {
    const days: CalDay[] = [];
    const first = new Date(this.currentYear, this.currentMonth, 1);
    const start = new Date(first);
    const dow   = (first.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, otherMonth: d.getMonth() !== this.currentMonth, rdvs: this.rdvsForDay(d) });
    }
    this.calDays = days;
    this.selectedDay = undefined;
  }

  rdvsForDay(d: Date): any[] {
    const ds = this.toDateStr(d);
    return this.allRdvs.filter(r => r.dateHeure?.startsWith(ds))
      .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  }

  rdvsThisMonth(): number {
    return this.calDays.filter(d => !d.otherMonth).reduce((s, d) => s + d.rdvs.length, 0);
  }

  // ── Navigation ─────────────────────────────────────────────────────

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
    this.currentMonth = new Date().getMonth();
    this.currentYear  = new Date().getFullYear();
    this.buildCalendar();
  }

  // ── Sélection ──────────────────────────────────────────────────────

  selectDay(day: CalDay): void { this.selectedDay = day; }
  openRdv(r: any, e: Event): void { e.stopPropagation(); this.selectedRdv = r; }
  closeModal(): void { this.selectedRdv = null; }

  // ── Drag & Drop HTML5 ──────────────────────────────────────────────

  onDragStart(e: DragEvent, rdv: any): void {
    this.draggingRdv = rdv;
    e.dataTransfer?.setData('text/plain', String(rdv.id));
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault(); // nécessaire pour autoriser le drop
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDrop(e: DragEvent, newDate: Date): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    if (!this.draggingRdv || !this.canEdit()) return;

    const rdv = this.draggingRdv;
    this.draggingRdv = null;

    // Conserver l'heure d'origine, changer seulement le jour
    const oldDate = new Date(rdv.dateHeure);
    const merged  = new Date(newDate);
    merged.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    // Ne pas déplacer si même date
    if (this.toDateStr(merged) === this.toDateStr(oldDate)) return;

    const updated = { ...rdv, dateHeure: merged.toISOString().slice(0, 16) };
    this.api.saveRdv(updated, rdv.id).subscribe({
      next: () => {
        // Mettre à jour localement
        const idx = this.allRdvs.findIndex(r => r.id === rdv.id);
        if (idx > -1) this.allRdvs[idx] = updated;
        this.buildCalendar();
        this.showToast('success', 'fa fa-check-circle',
          `RDV déplacé au ${this.formatDate(newDate)}`);
      },
      error: () => this.showToast('error', 'fa fa-circle-xmark', 'Impossible de déplacer ce RDV.')
    });
  }

  // ── Changement statut ──────────────────────────────────────────────

  changeStatut(statut: string): void {
    if (!this.selectedRdv) return;
    const rdv = { ...this.selectedRdv, statut };
    this.api.saveRdv(rdv, rdv.id).subscribe({
      next: () => {
        const idx = this.allRdvs.findIndex(r => r.id === rdv.id);
        if (idx > -1) this.allRdvs[idx] = rdv;
        this.buildCalendar();
        this.showToast('success', 'fa fa-check-circle', `Statut : ${statut}`);
        this.closeModal();
      },
      error: () => this.showToast('error', 'fa fa-circle-xmark', 'Erreur lors de la mise à jour.')
    });
  }

  onMedecinChange(e: Event): void {
    const id = +(e.target as HTMLSelectElement).value || undefined;
    const obs = id ? this.api.rdvsMedecin(id) : this.api.rdvs();
    obs.subscribe(r => { this.allRdvs = r; this.buildCalendar(); });
  }

  canEdit(): boolean {
    const r = this.auth.role();
    return r === 'ADMIN' || r === 'MEDECIN' || r === 'SECRETAIRE';
  }

  // ── Helpers ────────────────────────────────────────────────────────

  toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  isToday(d: Date): boolean {
    const n = new Date();
    return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }
  isSameDay(a: Date, b: Date): boolean {
    return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();
  }
  monthName(): string { return this.months[this.currentMonth]; }
  formatDate(d: Date): string {
    return `${d.getDate()} ${this.months[d.getMonth()]} ${d.getFullYear()}`;
  }
  formatDatetime(s: string): string {
    if (!s) return '-';
    const d = new Date(s);
    return d.toLocaleString('fr-FR', { weekday:'short', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
  }

  private showToast(type: string, icon: string, msg: string): void {
    this.toast = { show: true, type, icon, msg };
    setTimeout(() => this.toast.show = false, 3500);
  }
}
