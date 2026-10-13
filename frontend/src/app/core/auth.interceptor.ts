import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() doit être appelé ici, dans le contexte d'injection, et non dans le callback d'erreur.
  const router = inject(Router);
  let jetonEnvoye = false;
  const token = localStorage.getItem('clinique_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp && Date.now() / 1000 > payload.exp;
      if (!expired) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        jetonEnvoye = true;
      } else {
        localStorage.removeItem('clinique_token');
        localStorage.removeItem('clinique_auth');
      }
    } catch {
      localStorage.removeItem('clinique_token');
      localStorage.removeItem('clinique_auth');
    }
  }
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 : session expirée ou invalide → reconnexion. Un 403 (droits insuffisants) ne déconnecte pas l'utilisateur.
      if (err.status === 401 && jetonEnvoye) {
        localStorage.removeItem('clinique_token');
        localStorage.removeItem('clinique_auth');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
