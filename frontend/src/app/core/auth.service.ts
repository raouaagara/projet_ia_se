import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface AuthUser {
  token: string;
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'MEDECIN' | 'SECRETAIRE' | 'PATIENT';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private key = 'clinique_auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, motDePasse: string) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/login`, { email, motDePasse }).pipe(
      tap((res) => this.persist(res))
    );
  }

  register(payload: { email: string; motDePasse: string; nom: string; prenom: string; telephone?: string }) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap((res) => this.persist(res))
    );
  }

  persist(res: AuthUser): void {
    localStorage.setItem(this.key, JSON.stringify(res));
    localStorage.setItem('clinique_token', res.token);
  }

  logout(): void {
    localStorage.removeItem(this.key);
    localStorage.removeItem('clinique_token');
    this.router.navigate(['/login']);
  }

  current(): AuthUser | null {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) as AuthUser : null;
  }

  isLoggedIn(): boolean {
    const token = this.current()?.token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp && Date.now() / 1000 > payload.exp;
      if (expired) { this.logout(); return false; }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  role(): string | null {
    return this.current()?.role ?? null;
  }

  homeForRole(): string {
    if (this.role() === 'PATIENT') return '/front';
    if (this.role() === 'LABO')    return '/labo';
    if (this.role() === 'SECRETAIRE') return '/secretaire';
    return '/back';
  }
}
