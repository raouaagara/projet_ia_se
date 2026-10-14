import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Service qui ping le backend toutes les 10 minutes
 * pour éviter le cold start de Render Free.
 */
@Injectable({ providedIn: 'root' })
export class KeepAliveService {

  private interval: any;

  constructor(private http: HttpClient) {}

  start(): void {
    // Ping immédiat au démarrage
    this.ping();
    // Puis toutes les 10 minutes (600 000 ms)
    this.interval = setInterval(() => this.ping(), 600000);
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
  }

  private ping(): void {
    this.http.get(`${environment.apiUrl}/medecins`, { responseType: 'text' })
      .subscribe({ error: () => {} }); // silencieux
  }
}
