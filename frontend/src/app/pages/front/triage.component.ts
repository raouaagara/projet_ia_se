import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IaService, NiveauUrgence, TriageResultat } from '../../core/ia.service';

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  template: `
    <div class="mc-page tr-page">
      <div class="mc-head">
        <div>
          <h1 class="mc-title"><i class="fa fa-stethoscope"></i> Pré-diagnostic IA</h1>
          <p class="mc-sub">Décrivez vos symptômes : l'assistant vous indique la spécialité adaptée, le degré d'urgence et les médecins disponibles.</p>
        </div>
      </div>

      <div class="mc-alert mc-alert-warning">
        <i class="fa fa-triangle-exclamation"></i>
        <div><strong>Ce service ne remplace pas un avis médical.</strong> En cas d'urgence vitale (douleur dans la poitrine, difficulté à respirer, perte de connaissance…), appelez immédiatement le <strong>190</strong> (SAMU) ou le <strong>198</strong> (Protection civile).</div>
      </div>

      <div class="mc-grid-main">
        <section class="mc-panel">
          <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-pen"></i> Vos symptômes</div></div>
          <div class="mc-panel-body tr-form">
            <div class="mc-field">
              <label for="tr-sym">Que ressentez-vous, depuis quand, avec quelle intensité ?</label>
              <textarea id="tr-sym" [(ngModel)]="symptomes" maxlength="2000" rows="6"
                placeholder="Ex. : « J'ai de la fièvre à 38,5 et mal à la gorge depuis deux jours, j'ai du mal à avaler. »"></textarea>
              <span class="mc-field-hint">{{ symptomes.length }} / 2000 caractères — ne mentionnez ni votre nom ni votre numéro de dossier.</span>
            </div>
            <div class="tr-chips">
              <button class="mc-btn mc-btn-sm" *ngFor="let e of exemples" (click)="symptomes = e">{{ e.split(' ').slice(0, 4).join(' ') }}…</button>
            </div>
            <div class="mc-alert mc-alert-error" *ngIf="erreur"><i class="fa fa-circle-exclamation"></i> {{ erreur }}</div>
            <div class="mc-actions">
              <button class="mc-btn mc-btn-primary" (click)="analyser()" [disabled]="envoi || symptomes.trim().length < 5">
                <i class="fa" [ngClass]="envoi ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i> Analyser mes symptômes
              </button>
            </div>
          </div>
        </section>

        <section class="mc-panel" *ngIf="!resultat">
          <div class="mc-empty"><i class="fa fa-user-doctor"></i>Le résultat de l'analyse s'affichera ici.</div>
        </section>

        <section class="mc-panel" *ngIf="resultat">
          <div class="tr-banner" [ngClass]="'tr-' + resultat.niveauUrgence">
            <i class="fa" [ngClass]="icone(resultat.niveauUrgence)"></i>
            <div>
              <div class="tr-banner-t">{{ libelle(resultat.niveauUrgence) }}</div>
              <div class="tr-banner-s">{{ resultat.conseils }}</div>
            </div>
          </div>
          <div class="mc-panel-body tr-res">
            <div *ngIf="resultat.niveauUrgence !== 'URGENCE_VITALE'">
              <div class="mc-muted">Spécialité conseillée</div>
              <div class="tr-spec">{{ resultat.specialite }}</div>
            </div>
            <p>{{ resultat.justification }}</p>

            <div *ngIf="resultat.niveauUrgence === 'URGENCE_VITALE'" class="tr-urgence">
              <a class="mc-btn tr-call" href="tel:190"><i class="fa fa-phone"></i> Appeler le 190 (SAMU)</a>
              <a class="mc-btn tr-call" href="tel:198"><i class="fa fa-phone"></i> Appeler le 198</a>
            </div>

            <div *ngIf="resultat.medecins.length">
              <div class="mc-muted" style="margin-bottom:8px">Médecins disponibles</div>
              <div class="tr-med" *ngFor="let m of resultat.medecins">
                <div class="tr-av"><i class="fa fa-user-doctor"></i></div>
                <div class="tr-med-txt">
                  <div class="mc-strong">{{ m.nom }}</div>
                  <div class="mc-muted">{{ m.specialite }}<span *ngIf="m.horaires"> · {{ m.horaires }}</span></div>
                </div>
                <button class="mc-btn mc-btn-sm mc-btn-primary" (click)="prendreRdv(m.id)"><i class="fa fa-calendar-plus"></i> Prendre RDV</button>
              </div>
            </div>
            <div class="mc-disclaimer"><i class="fa fa-circle-info"></i> {{ resultat.avertissement }}
              ({{ resultat.source === 'GROQ' ? 'modèle de langage' : 'moteur de règles' }})</div>
          </div>
        </section>
      </div>

      <section class="mc-panel" *ngIf="historique.length">
        <div class="mc-panel-head"><div class="mc-panel-title"><i class="fa fa-clock-rotate-left"></i> Mes précédentes analyses</div></div>
        <div class="mc-list">
          <div class="mc-list-item" *ngFor="let h of historique.slice(0, 5)">
            <span class="mc-chip" [ngClass]="ton(h.niveauUrgence)">{{ libelle(h.niveauUrgence) }}</span>
            <div>
              <div class="mc-strong">{{ h.specialite }} <span class="mc-muted">· {{ h.dateTriage | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="mc-muted">{{ h.symptomes }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .tr-page { --mc-accent:#0f6cbd; }
    .tr-form { display:flex; flex-direction:column; gap:14px; }
    .tr-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .tr-banner { display:flex; gap:14px; align-items:center; padding:16px 18px; color:#fff; }
    .tr-banner i { font-size:24px; }
    .tr-banner-t { font-size:16px; font-weight:800; }
    .tr-banner-s { font-size:13.5px; opacity:.92; margin-top:2px; }
    .tr-FAIBLE { background:#047857; } .tr-MODERE { background:#0f6cbd; } .tr-ELEVE { background:#c2410c; } .tr-URGENCE_VITALE { background:#b91c1c; }
    .tr-res { display:flex; flex-direction:column; gap:14px; }
    .tr-spec { font-size:20px; font-weight:800; color:var(--text); }
    .tr-med { display:flex; align-items:center; gap:12px; padding:10px 0; border-top:1px solid var(--border); }
    .tr-av { width:38px; height:38px; border-radius:50%; background:#e8f4ff; color:#0f6cbd; display:flex; align-items:center; justify-content:center; }
    .tr-med-txt { flex:1; min-width:0; }
    .tr-urgence { display:flex; gap:10px; flex-wrap:wrap; }
    .tr-call { background:#b91c1c; color:#fff; border-color:#b91c1c; }
    .tr-call:hover { color:#fff; filter:brightness(1.1); }
  `]
})
export class TriageComponent implements OnInit {
  symptomes = '';
  resultat?: TriageResultat;
  historique: TriageResultat[] = [];
  envoi = false;
  erreur = '';
  readonly exemples = [
    "J'ai de la fièvre à 38,5 et mal à la gorge depuis deux jours, j'ai du mal à avaler.",
    "Des plaques rouges qui démangent sur les bras depuis une semaine.",
    "Des palpitations quand je monte les escaliers et une tension un peu élevée.",
    "Des douleurs au ventre et des nausées après les repas depuis quelques jours."
  ];

  constructor(private ia: IaService, private router: Router) {}

  ngOnInit(): void {
    this.ia.mesTriages().subscribe({ next: h => this.historique = h, error: () => {} });
  }

  analyser(): void {
    this.envoi = true;
    this.erreur = '';
    this.ia.triage(this.symptomes.trim()).subscribe({
      next: r => { this.envoi = false; this.resultat = r; this.historique = [r, ...this.historique]; },
      error: (e: HttpErrorResponse) => { this.envoi = false; this.erreur = e.error?.message ?? 'L\'analyse n\'a pas pu être réalisée. Réessayez dans un instant.'; }
    });
  }

  prendreRdv(medecinId: number): void {
    this.router.navigate(['/front/rdv'], { queryParams: { medecinId, motif: this.resultat?.specialite ? `Pré-diagnostic : ${this.resultat.specialite}` : '' } });
  }

  libelle(n: NiveauUrgence): string {
    return ({ FAIBLE: 'Urgence faible', MODERE: 'Urgence modérée', ELEVE: 'Consultation rapide recommandée', URGENCE_VITALE: 'Urgence vitale — appelez le 190' } as Record<string, string>)[n];
  }

  icone(n: NiveauUrgence): string {
    return ({ FAIBLE: 'fa-circle-check', MODERE: 'fa-circle-info', ELEVE: 'fa-triangle-exclamation', URGENCE_VITALE: 'fa-truck-medical' } as Record<string, string>)[n];
  }

  ton(n: NiveauUrgence): string {
    return ({ FAIBLE: 'tone-green', MODERE: 'tone-blue', ELEVE: 'tone-orange', URGENCE_VITALE: 'tone-red' } as Record<string, string>)[n];
  }
}
