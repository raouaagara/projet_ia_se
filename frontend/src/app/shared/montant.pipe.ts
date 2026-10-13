import { Pipe, PipeTransform } from '@angular/core';

/** Devise de la clinique : un seul endroit à modifier pour changer l'affichage de tous les montants. */
export const DEVISE = { symbole: 'DT', decimales: 3 };

export function formatMontant(valeur: number | null | undefined, decimales: number = DEVISE.decimales): string {
  const n = Number(valeur ?? 0);
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + ' ' + DEVISE.symbole;
}

/** Affiche un montant au format français dans la devise de la clinique (ex. « 1 234,500 DT »). */
@Pipe({ name: 'montant', standalone: true })
export class MontantPipe implements PipeTransform {
  transform(valeur: number | null | undefined, decimales: number = DEVISE.decimales): string {
    return formatMontant(valeur, decimales);
  }
}
