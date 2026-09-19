import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── PATIENTS ──────────────────────────────────────────────────────
  patients() { return this.http.get<any[]>(`${this.base}/patients`); }
  patient(id: number) { return this.http.get<any>(`${this.base}/patients/${id}`); }
  patientByUser(id: number) { return this.http.get<any>(`${this.base}/patients/utilisateur/${id}`); }
  patientsByMedecin(medecinId: number) { return this.http.get<any[]>(`${this.base}/patients/medecin/${medecinId}`); }
  savePatient(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/patients/${id}`, body) : this.http.post(`${this.base}/patients`, body);
  }
  deletePatient(id: number) { return this.http.delete(`${this.base}/patients/${id}`); }

  // ── MÉDECINS ─────────────────────────────────────────────────────
  medecins() { return this.http.get<any[]>(`${this.base}/medecins`); }
  medecinByUser(uid: number) { return this.http.get<any>(`${this.base}/medecins/utilisateur/${uid}`); }
  saveMedecin(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/medecins/${id}`, body) : this.http.post(`${this.base}/medecins`, body);
  }
  deleteMedecin(id: number) { return this.http.delete(`${this.base}/medecins/${id}`); }

  // ── RENDEZ-VOUS ──────────────────────────────────────────────────
  rdvs() { return this.http.get<any[]>(`${this.base}/rendez-vous`); }
  rdvsPatient(id: number) { return this.http.get<any[]>(`${this.base}/rendez-vous/patient/${id}`); }
  rdvsMedecin(id: number) { return this.http.get<any[]>(`${this.base}/rendez-vous/medecin/${id}`); }
  saveRdv(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/rendez-vous/${id}`, body) : this.http.post(`${this.base}/rendez-vous`, body);
  }
  deleteRdv(id: number) { return this.http.delete(`${this.base}/rendez-vous/${id}`); }

  // ── CONSULTATIONS ────────────────────────────────────────────────
  consultations() { return this.http.get<any[]>(`${this.base}/consultations`); }
  consultationsPatient(id: number) { return this.http.get<any[]>(`${this.base}/consultations/patient/${id}`); }
  consultationsMedecin(id: number) { return this.http.get<any[]>(`${this.base}/consultations/medecin/${id}`); }
  saveConsultation(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/consultations/${id}`, body) : this.http.post(`${this.base}/consultations`, body);
  }
  deleteConsultation(id: number) { return this.http.delete(`${this.base}/consultations/${id}`); }

  // ── ORDONNANCES ──────────────────────────────────────────────────
  ordonnances() { return this.http.get<any[]>(`${this.base}/ordonnances`); }
  ordonnancesPatient(id: number) { return this.http.get<any[]>(`${this.base}/ordonnances/patient/${id}`); }
  saveOrdonnance(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/ordonnances/${id}`, body) : this.http.post(`${this.base}/ordonnances`, body);
  }
  deleteOrdonnance(id: number) { return this.http.delete(`${this.base}/ordonnances/${id}`); }

  // ── UTILISATEURS ─────────────────────────────────────────────────
  utilisateurs() { return this.http.get<any[]>(`${this.base}/utilisateurs`); }
  utilisateur(id: number) { return this.http.get<any>(`${this.base}/utilisateurs/${id}`); }
  saveUtilisateur(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/utilisateurs/${id}`, body) : this.http.post(`${this.base}/utilisateurs`, body);
  }
  deleteUtilisateur(id: number) { return this.http.delete(`${this.base}/utilisateurs/${id}`); }

  // ── STATISTIQUES ─────────────────────────────────────────────────
  stats() { return this.http.get<any>(`${this.base}/statistiques`); }
  statsDetail() { return this.http.get<any>(`${this.base}/statistiques-detail`); }

  // ── FACTURES ─────────────────────────────────────────────────────
  factures() { return this.http.get<any[]>(`${this.base}/factures`); }
  factureById(id: number) { return this.http.get<any>(`${this.base}/factures/${id}`); }
  facturesPatient(pid: number) { return this.http.get<any[]>(`${this.base}/factures/patient/${pid}`); }
  factureStats() { return this.http.get<any>(`${this.base}/factures/stats`); }
  saveFacture(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/factures/${id}`, body) : this.http.post(`${this.base}/factures`, body);
  }
  paiementFacture(id: number, montantPaye: number, statut: string) {
    return this.http.put(`${this.base}/factures/${id}/paiement`, { montantPaye, statut });
  }
  deleteFacture(id: number) { return this.http.delete(`${this.base}/factures/${id}`); }

  // ── EXAMENS ──────────────────────────────────────────────────────
  examens() { return this.http.get<any[]>(`${this.base}/examens`); }
  examenById(id: number) { return this.http.get<any>(`${this.base}/examens/${id}`); }
  examensPatient(pid: number) { return this.http.get<any[]>(`${this.base}/examens/patient/${pid}`); }
  examensMedecin(mid: number) { return this.http.get<any[]>(`${this.base}/examens/medecin/${mid}`); }
  saveExamen(body: any, id?: number) {
    return id ? this.http.put(`${this.base}/examens/${id}`, body) : this.http.post(`${this.base}/examens`, body);
  }
  saisirResultatExamen(id: number, resultat: string, fichier?: string) {
    return this.http.put(`${this.base}/examens/${id}/resultat`, { resultat, fichier });
  }
  deleteExamen(id: number) { return this.http.delete(`${this.base}/examens/${id}`); }

  // ── LABO ─────────────────────────────────────────────────────────
  publierResultat(body: { examenId: number; resultatTexte: string; fichierResultat?: string; notes?: string; dateResultat?: string }) {
    return this.http.post<any>(`${this.base}/labo/resultats`, body);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────
  notifications(uid: number) { return this.http.get<any[]>(`${this.base}/notifications/utilisateur/${uid}`); }
  notificationsNonLues(uid: number) { return this.http.get<any[]>(`${this.base}/notifications/utilisateur/${uid}/non-lues`); }
  countNotifications(uid: number) { return this.http.get<any>(`${this.base}/notifications/utilisateur/${uid}/count`); }
  countNotificationsNonLues(uid: number) { return this.countNotifications(uid); } // alias
  marquerNotifLue(id: number) { return this.http.put(`${this.base}/notifications/${id}/lire`, {}); }
  marquerLue(id: number) { return this.marquerNotifLue(id); } // alias
  marquerNotifsLues(uid: number) { return this.http.put(`${this.base}/notifications/utilisateur/${uid}/lire-tout`, {}); }
  marquerToutesLues(uid: number) { return this.marquerNotifsLues(uid); } // alias
  supprimerNotification(id: number) { return this.http.delete(`${this.base}/notifications/${id}`); }
  createNotifTest(uid: number) { return this.http.post(`${this.base}/notifications/test/${uid}`, {}); }

  // ── CHATBOT ──────────────────────────────────────────────────────
  chatbot(message: string, contexte = 'clinique', role?: string, userName?: string) {
    return this.http.post<{ reponse: string; source: string }>(`${this.base}/chatbot`, { message, contexte, role, userName });
  }
}
