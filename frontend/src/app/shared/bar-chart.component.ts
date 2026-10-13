import { Component, Input, OnChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface Barre { libelle: string; valeur: number; detail?: string; }

/**
 * Histogramme simple à une série (barres verticales). Une seule couleur pour toutes les barres,
 * grille discrète, seule la valeur maximale est étiquetée ; les autres valeurs s'affichent au survol.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="bc-root" [attr.aria-label]="titre" role="img">
      <div class="bc-plot" [style.height.px]="hauteur">
        <div class="bc-grid" *ngFor="let g of graduations" [style.bottom.%]="g / max * 100">
          <span class="bc-tick">{{ g }}</span>
        </div>
        <div class="bc-bars">
          <div class="bc-col" *ngFor="let b of donnees; let i = index"
               (mouseenter)="survol = i" (mouseleave)="survol = -1" (focus)="survol = i" (blur)="survol = -1" tabindex="0"
               [attr.aria-label]="b.libelle + ' : ' + b.valeur + ' ' + unite">
            <div class="bc-label-top" *ngIf="i === indexMax && survol !== i" [style.bottom.%]="b.valeur / max * 100">{{ b.valeur }}</div>
            <div class="bc-bar" [style.height.%]="b.valeur / max * 100"></div>
            <div class="bc-tip" *ngIf="survol === i" [style.bottom.%]="b.valeur / max * 100">
              <strong>{{ b.libelle }}</strong><br>{{ b.valeur }} {{ unite }}<span *ngIf="b.detail"><br>{{ b.detail }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bc-axis">
        <div class="bc-x" *ngFor="let b of donnees">{{ b.libelle }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; --bc-bar:#2a78d6; }
    :host-context(html.dark) { --bc-bar:#3987e5; }
    .bc-root { padding: 8px 4px 0 34px; }
    .bc-plot { position:relative; border-bottom:1px solid var(--border); }
    .bc-grid { position:absolute; left:0; right:0; border-top:1px solid var(--border); opacity:.7; }
    .bc-tick { position:absolute; left:-34px; top:-8px; width:28px; text-align:right; font-size:11px; color:var(--text-muted); font-variant-numeric:tabular-nums; }
    .bc-bars { position:absolute; inset:0; display:flex; align-items:flex-end; }
    .bc-col { position:relative; flex:1; height:100%; display:flex; align-items:flex-end; justify-content:center; outline:none; cursor:default; }
    .bc-col:hover .bc-bar, .bc-col:focus .bc-bar { filter:brightness(1.12); }
    .bc-bar { width:min(24px, 60%); background:var(--bc-bar); border-radius:4px 4px 0 0; min-height:2px; transition:height .3s ease; }
    .bc-label-top { position:absolute; transform:translateY(-4px); font-size:12px; font-weight:700; color:var(--text); margin-bottom:2px; }
    .bc-tip { position:absolute; transform:translateY(-8px); background:var(--text); color:var(--surface); font-size:12px; line-height:1.4; padding:6px 9px; border-radius:8px; white-space:nowrap; z-index:2; pointer-events:none; box-shadow:var(--shadow); }
    .bc-axis { display:flex; padding-top:6px; }
    .bc-x { flex:1; text-align:center; font-size:11.5px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  `]
})
export class BarChartComponent implements OnChanges {
  @Input() donnees: Barre[] = [];
  @Input() unite = '';
  @Input() titre = '';
  @Input() hauteur = 180;

  max = 1;
  indexMax = -1;
  graduations: number[] = [];
  survol = -1;

  ngOnChanges(): void {
    const plusGrand = Math.max(0, ...this.donnees.map(d => d.valeur));
    const pas = plusGrand <= 4 ? 1 : plusGrand <= 10 ? 2 : Math.ceil(plusGrand / 4);
    this.max = Math.max(pas, Math.ceil(plusGrand / pas) * pas);
    this.graduations = [];
    for (let g = pas; g <= this.max; g += pas) this.graduations.push(g);
    this.indexMax = plusGrand > 0 ? this.donnees.findIndex(d => d.valeur === plusGrand) : -1;
  }
}
