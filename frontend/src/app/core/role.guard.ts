import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[]) || [];
  const current = auth.role();

  // Si pas de restriction de rôle définie → autoriser
  if (!roles.length) return true;

  // Si le rôle correspond → autoriser
  if (current && roles.includes(current)) return true;

  // Sinon → rediriger vers la home du rôle
  return router.createUrlTree([auth.homeForRole()]);
};
