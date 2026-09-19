import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('clinique_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp && Date.now() / 1000 > payload.exp;
      if (!expired) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
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
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('clinique_token');
        localStorage.removeItem('clinique_auth');
        const router = inject(Router);
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
