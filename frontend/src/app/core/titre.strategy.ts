import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Titre de l'onglet : « <titre de la route> · MediCare », ou le titre par défaut si la route n'en définit pas. */
@Injectable({ providedIn: 'root' })
export class TitreStrategy extends TitleStrategy {
  static readonly DEFAUT = 'MediCare — Clinique Médicale';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const titre = this.buildTitle(snapshot);
    this.title.setTitle(titre ? `${titre} · MediCare` : TitreStrategy.DEFAUT);
  }
}
