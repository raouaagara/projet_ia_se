import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Lot {
  id: number; medicamentId: number; medicamentNom: string;
  fournisseurId?: number; fournisseurNom?: string;
  numeroLot: string; quantiteInitiale: number; quantiteRestante: number;
  datePeremption: string; dateReception: string; prixAchat?: number;
  perime: boolean; joursAvantPeremption: number;
}

export interface Medicament {
  id?: number; code: string; nomCommercial: string; dci?: string; forme?: string; dosage?: string;
  prixUnitaire: number; seuilAlerte: number; surOrdonnance: boolean; actif: boolean;
  libelle?: string; stockDisponible?: number; sousSeuil?: boolean; enRupture?: boolean;
  prochainePeremption?: string; lots?: Lot[];
}

export interface Fournisseur { id?: number; nom: string; telephone?: string; email?: string; adresse?: string; actif: boolean; }

export interface Mouvement {
  id: number; type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'PEREMPTION'; quantite: number; motif: string;
  dateMouvement: string; lotId: number; numeroLot: string; medicamentId: number; medicamentNom: string; utilisateurNom?: string;
}

export interface AlerteStock {
  type: 'RUPTURE' | 'STOCK_BAS' | 'PERIME' | 'PEREMPTION_PROCHE'; niveau: 'CRITIQUE' | 'ATTENTION';
  medicamentId: number; medicamentNom: string; lotId?: number; numeroLot?: string;
  quantite: number; datePeremption?: string; message: string;
}

export interface TableauBordPharmacie {
  medicamentsActifs: number; unitesEnStock: number; valeurStock: number; ruptures: number; stocksBas: number;
  lotsPerimes: number; peremptionsProches: number; ordonnancesADelivrer: number; delivrancesAujourdhui: number; fournisseurs: number;
}

export interface LigneOrdonnance {
  id?: number; medicamentId: number; medicamentNom?: string; posologie?: string; dureeJours?: number; quantite: number;
  quantiteDelivree?: number; resteADelivrer?: number; stockDisponible?: number;
}

export interface Ordonnance {
  id?: number; consultationId: number; dateEmission?: string; medicaments?: string; instructions?: string;
  lignes: LigneOrdonnance[]; statutDelivrance?: 'NON_DELIVREE' | 'PARTIELLE' | 'COMPLETE' | null;
  patientId?: number; patientNom?: string; numeroDossier?: string; medecinId?: number; medecinNom?: string;
}

export interface Delivrance {
  id: number; ordonnanceId: number; patientNom: string; numeroDossier: string; medecinNom: string; pharmacienNom?: string;
  statut: 'PARTIELLE' | 'COMPLETE'; montantTotal: number; factureId?: number; numeroFacture?: string; dateDelivrance: string;
  lignes: { medicamentNom: string; numeroLot: string; datePeremption: string; quantite: number; prixUnitaire: number; total: number }[];
  avertissements: string[];
}

@Injectable({ providedIn: 'root' })
export class PharmacieService {
  private base = `${environment.apiUrl}/pharmacie`;

  constructor(private http: HttpClient) {}

  tableauDeBord() { return this.http.get<TableauBordPharmacie>(`${this.base}/tableau-de-bord`); }

  medicaments(q = '') {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<Medicament[]>(`${this.base}/medicaments`, { params });
  }
  enregistrerMedicament(m: Medicament) {
    return m.id ? this.http.put<Medicament>(`${this.base}/medicaments/${m.id}`, m)
                : this.http.post<Medicament>(`${this.base}/medicaments`, m);
  }
  supprimerMedicament(id: number) { return this.http.delete(`${this.base}/medicaments/${id}`); }

  fournisseurs() { return this.http.get<Fournisseur[]>(`${this.base}/fournisseurs`); }
  enregistrerFournisseur(f: Fournisseur) {
    return f.id ? this.http.put<Fournisseur>(`${this.base}/fournisseurs/${f.id}`, f)
                : this.http.post<Fournisseur>(`${this.base}/fournisseurs`, f);
  }
  supprimerFournisseur(id: number) { return this.http.delete(`${this.base}/fournisseurs/${id}`); }

  stock() { return this.http.get<Medicament[]>(`${this.base}/stock`); }
  receptionner(body: { medicamentId: number; fournisseurId?: number | null; numeroLot: string; quantite: number; datePeremption: string; prixAchat?: number | null }) {
    return this.http.post<Lot>(`${this.base}/receptions`, body);
  }
  ajuster(body: { lotId: number; nouvelleQuantite: number; motif: string }) { return this.http.post<Lot>(`${this.base}/ajustements`, body); }
  retirerLotsPerimes() { return this.http.post<{ lotsRetires: number }>(`${this.base}/lots-perimes/retrait`, {}); }
  mouvements(type?: string) {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Mouvement[]>(`${this.base}/mouvements`, { params });
  }
  alertes() { return this.http.get<AlerteStock[]>(`${this.base}/alertes`); }

  ordonnancesADelivrer() { return this.http.get<Ordonnance[]>(`${this.base}/ordonnances`); }
  delivrer(body: { ordonnanceId: number; lignes: { ligneOrdonnanceId: number; quantite: number }[]; facturer: boolean }) {
    return this.http.post<Delivrance>(`${this.base}/delivrances`, body);
  }
  delivrances() { return this.http.get<Delivrance[]>(`${this.base}/delivrances`); }
  delivrancesOrdonnance(id: number) { return this.http.get<Delivrance[]>(`${this.base}/delivrances/ordonnance/${id}`); }
}
