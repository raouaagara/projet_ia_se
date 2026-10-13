import { Pipe, PipeTransform } from '@angular/core';

/** Initiales d'une personne, sans le titre « Dr » (ex. « Dr Jean Martin » → « JM »). */
@Pipe({ name: 'initiales', standalone: true })
export class InitialesPipe implements PipeTransform {
  transform(nom: string | null | undefined): string {
    return (nom ?? '')
      .replace(/^Dr\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(mot => mot.charAt(0).toUpperCase())
      .join('');
  }
}
