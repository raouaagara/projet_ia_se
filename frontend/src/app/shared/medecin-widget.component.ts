import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-medecin-widget',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="mw" [class.mw-compact]="compact" [class.mw-selected]="selected">
      <!-- Avatar + dispo -->
      <div class="mw-top">
        <div class="mw-avatar" [style.background]="specGrad(medecin?.specialite)">
          {{ medecin?.prenom?.charAt(0) }}{{ medecin?.nom?.charAt(0) }}
        </div>
        <span class="mw-dispo" [class.on]="medecin?.disponible" [class.off]="!medecin?.disponible">
          <i class="fa fa-circle"></i>
          {{ medecin?.disponible ? 'Disponible' : 'Indisponible' }}
        </span>
      </div>

      <!-- Nom & spécialité -->
      <div class="mw-name">Dr {{ medecin?.prenom }} {{ medecin?.nom }}</div>
      <div class="mw-spec">
        <i class="fa fa-stethoscope"></i> {{ medecin?.specialite }}
      </div>

      <!-- Faculté -->
      <div class="mw-faculte" *ngIf="medecin?.faculte && !compact">
        <i class="fa fa-graduation-cap"></i> {{ medecin?.faculte }}
      </div>

      <!-- Horaires -->
      <div class="mw-horaires" *ngIf="medecin?.horaires && !compact">
        <i class="fa fa-clock"></i> {{ medecin?.horaires }}
      </div>

      <!-- Matricule -->
      <div class="mw-matricule" *ngIf="medecin?.matricule && !compact">
        <i class="fa fa-id-card"></i> {{ medecin?.matricule }}
      </div>

      <!-- Action slot -->
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .mw {
      background: var(--surface, #fff);
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 16px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all .22s;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,.05);
    }
    .mw:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
    .mw.mw-selected {
      border-color: #0f6cbd;
      background: #f0f9ff;
      box-shadow: 0 0 0 3px rgba(15,108,189,.15);
    }
    .mw.mw-compact { padding: 12px; gap: 5px; }

    .mw-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }

    .mw-avatar {
      width: 48px; height: 48px; border-radius: 13px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 17px; font-weight: 900;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }
    .mw-compact .mw-avatar { width: 36px; height: 36px; border-radius: 10px; font-size: 13px; }

    .mw-dispo {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 700;
    }
    .mw-dispo i { font-size: 7px; }
    .mw-dispo.on  { background: #dcfce7; color: #15803d; }
    .mw-dispo.off { background: #fee2e2; color: #b91c1c; }

    .mw-name {
      font-size: 15px; font-weight: 800;
      color: var(--text, #0f172a); line-height: 1.2;
    }
    .mw-compact .mw-name { font-size: 13.5px; }

    .mw-spec, .mw-faculte, .mw-horaires, .mw-matricule {
      display: flex; align-items: center; gap: 7px;
      font-size: 13px; color: var(--text-muted, #64748b);
    }
    .mw-spec i   { color: #0f6cbd; }
    .mw-faculte i{ color: #7e22ce; }
    .mw-horaires i{ color: #f59e0b; }
    .mw-matricule i{ color: #64748b; font-size: 12px; }

    .mw-compact .mw-spec { font-size: 11.5px; }
  `]
})
export class MedecinWidgetComponent {
  @Input() medecin: any;
  @Input() compact = false;
  @Input() selected = false;

  specGrad(spec: string): string {
    const m: Record<string, string> = {
      'Cardiologie':       'linear-gradient(135deg,#ef4444,#f97316)',
      'Neurologie':        'linear-gradient(135deg,#9333ea,#7c3aed)',
      'Orthopédie':        'linear-gradient(135deg,#f59e0b,#d97706)',
      'Ophtalmologie':     'linear-gradient(135deg,#0284c7,#0369a1)',
      'Pédiatrie':         'linear-gradient(135deg,#db2777,#be185d)',
      'Chirurgie':         'linear-gradient(135deg,#0f6cbd,#0a4f99)',
      'Médecine Générale': 'linear-gradient(135deg,#22c55e,#15803d)',
      'Dermatologie':      'linear-gradient(135deg,#f59e0b,#b45309)',
      'Gynécologie':       'linear-gradient(135deg,#ec4899,#db2777)',
      'Rhumatologie':      'linear-gradient(135deg,#6366f1,#4338ca)',
    };
    return m[spec] ?? 'linear-gradient(135deg,#0f6cbd,#00b389)';
  }
}
