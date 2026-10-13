import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AnalyseIA, IaService } from '../core/ia.service';
import { AuthService } from '../core/auth.service';

/** Fenêtre d'analyse IA pour le médecin : résumé de dossier ou aide à l'interprétation d'un résultat. */
@Component({
  selector: 'app-ia-analyse',
  standalone: true,
  imports: [NgIf, NgClass, DatePipe],
  template: `
    <div class="mc-overlay" (click)="fermer.emit()">
      <div class="mc-modal mc-modal-lg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="ia-titre">
        <div class="mc-modal-head">
          <div class="mc-modal-title" id="ia-titre"><i class="fa fa-wand-magic-sparkles ia-ic"></i>
            {{ mode === 'resume' ? 'Résumé IA du dossier' : 'Aide à l\\'interprétation du résultat' }}<span class="mc-muted" *ngIf="titre">&nbsp;— {{ titre }}</span></div>
          <button class="mc-close" (click)="fermer.emit()" aria-label="Fermer"><i class="fa fa-xmark"></i></button>
        </div>
        <div class="mc-modal-body">
          <div class="mc-loading" *ngIf="chargement"><i class="fa fa-spinner fa-spin"></i> Analyse en cours…</div>
          <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
          <ng-container *ngIf="analyse">
            <div class="ia-meta">
              <span class="mc-chip" [ngClass]="analyse.source === 'GROQ' ? 'tone-violet' : 'tone-gray'">
                <i class="fa" [ngClass]="analyse.source === 'GROQ' ? 'fa-robot' : 'fa-list-check'"></i>
                {{ analyse.source === 'GROQ' ? 'Modèle ' + analyse.modele : 'Synthèse par règles locales' }}</span>
              <span class="mc-muted">Générée le {{ analyse.dateGeneration | date:'dd/MM/yyyy à HH:mm' }}</span>
              <span class="mc-chip tone-green" *ngIf="analyse.validee"><i class="fa fa-check"></i> Validée par {{ analyse.valideePar }}</span>
            </div>
            <div class="mc-pre ia-texte">{{ analyse.contenu }}</div>
            <div class="mc-disclaimer"><i class="fa fa-circle-info"></i> {{ analyse.avertissement }} Le médecin reste seul responsable de l'interprétation clinique.</div>
          </ng-container>
        </div>
        <div class="mc-modal-foot">
          <button class="mc-btn" (click)="fermer.emit()">Fermer</button>
          <button class="mc-btn mc-btn-primary" *ngIf="analyse && !analyse.validee && estMedecin()" (click)="valider()" [disabled]="validation">
            <i class="fa fa-check"></i> Valider cette analyse
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --mc-accent:#6250d6; }
    .ia-ic { color:#6250d6; }
    .ia-meta { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .ia-texte { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:14px 16px; max-height:55vh; overflow:auto; }
  `]
})
export class IaAnalyseComponent implements OnInit {
  @Input() mode: 'resume' | 'interpretation' = 'resume';
  @Input({ required: true }) cibleId!: number;
  @Input() titre = '';
  @Output() fermer = new EventEmitter<void>();

  analyse?: AnalyseIA;
  chargement = true;
  validation = false;
  erreur = '';

  constructor(private ia: IaService, private auth: AuthService) {}

  ngOnInit(): void {
    const requete = this.mode === 'resume' ? this.ia.resumeDossier(this.cibleId) : this.ia.interpretation(this.cibleId);
    requete.subscribe({
      next: a => { this.analyse = a; this.chargement = false; },
      error: (e: HttpErrorResponse) => { this.chargement = false; this.erreur = e.error?.message ?? 'L\'analyse n\'a pas pu être générée.'; }
    });
  }

  estMedecin(): boolean { return this.auth.role() === 'MEDECIN'; }

  valider(): void {
    if (!this.analyse) return;
    this.validation = true;
    this.ia.valider(this.analyse.id).subscribe({
      next: a => { this.analyse = a; this.validation = false; },
      error: () => { this.validation = false; this.erreur = 'La validation a échoué.'; }
    });
  }
}
