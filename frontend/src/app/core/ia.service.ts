import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type NiveauUrgence = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'URGENCE_VITALE';

export interface TriageResultat {
  id: number; symptomes: string; specialite: string; niveauUrgence: NiveauUrgence;
  justification: string; conseils: string; source: 'GROQ' | 'REGLES'; dateTriage: string;
  medecins: { id: number; nom: string; specialite: string; horaires?: string }[];
  avertissement: string;
}

export interface AnalyseIA {
  id: number; type: 'RESUME_DOSSIER' | 'INTERPRETATION_RESULTAT'; patientId: number; examenId?: number;
  contenu: string; source: 'GROQ' | 'REGLES'; modele: string; validee: boolean; valideePar?: string;
  dateGeneration: string; dateValidation?: string; avertissement: string;
}

export interface Previsions {
  semainesAnalysees: number; rendezVousAnalyses: number; tauxAnnulation: number;
  parJour: { jour: string; moyenne: number; tauxAnnulation: number }[];
  prochainsJours: { date: string; jour: string; dejaPlanifies: number; prevus: number; charge: 'FAIBLE' | 'NORMALE' | 'FORTE' }[];
  creneauxARisque: { jour: string; heure: number; rendezVous: number; tauxAnnulation: number }[];
  risquesRupture: { medicamentId: number; medicament: string; stock: number; consommationJournaliere: number; joursCouverture: number }[];
  recommandations: string[];
}

export interface StatutIA {
  fournisseur: string; modeleConnecte: boolean; modele: string;
  appelsTotal: number; appelsModele: number; appelsRegles: number; echecs: number;
}

export interface JournalIA {
  id: number; fonction: string; utilisateur?: string; role: string; source: string; modele: string;
  dureeMs: number; succes: boolean; erreur?: string; dateAppel: string;
}

@Injectable({ providedIn: 'root' })
export class IaService {
  private base = `${environment.apiUrl}/ia`;

  constructor(private http: HttpClient) {}

  triage(symptomes: string) { return this.http.post<TriageResultat>(`${this.base}/triage`, { symptomes }); }
  mesTriages() { return this.http.get<TriageResultat[]>(`${this.base}/triages/moi`); }
  resumeDossier(patientId: number) { return this.http.post<AnalyseIA>(`${this.base}/resume-dossier/${patientId}`, {}); }
  interpretation(examenId: number) { return this.http.post<AnalyseIA>(`${this.base}/interpretation/${examenId}`, {}); }
  valider(analyseId: number) { return this.http.put<AnalyseIA>(`${this.base}/analyses/${analyseId}/validation`, {}); }
  previsions() { return this.http.get<Previsions>(`${this.base}/previsions`); }
  statut() { return this.http.get<StatutIA>(`${this.base}/statut`); }
  journal() { return this.http.get<JournalIA[]>(`${this.base}/journal`); }
}
