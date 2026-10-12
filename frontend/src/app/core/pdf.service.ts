import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

/**
 * Service utilitaire pour ouvrir/télécharger un PDF depuis l'API.
 * Utilisation : this.pdf.ouvrir('ordonnance', 5)
 */
@Injectable({ providedIn: 'root' })
export class PdfService {

  constructor(private api: ApiService) {}

  /** Ouvre le PDF dans un nouvel onglet */
  ouvrir(type: 'ordonnance' | 'facture' | 'examen', id: number): void {
    const req = type === 'ordonnance' ? this.api.pdfOrdonnance(id)
              : type === 'facture'    ? this.api.pdfFacture(id)
              :                        this.api.pdfExamen(id);

    req.subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Libérer la mémoire après 60s
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: () => alert('Impossible de générer le PDF. Veuillez réessayer.')
    });
  }

  /** Télécharge le PDF */
  telecharger(type: 'ordonnance' | 'facture' | 'examen', id: number, nom?: string): void {
    const req = type === 'ordonnance' ? this.api.pdfOrdonnance(id)
              : type === 'facture'    ? this.api.pdfFacture(id)
              :                        this.api.pdfExamen(id);

    req.subscribe({
      next: (blob: Blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = nom ?? `${type}-${id}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => alert('Impossible de télécharger le PDF.')
    });
  }
}
