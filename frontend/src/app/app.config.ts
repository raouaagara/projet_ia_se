import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { TitreStrategy } from './core/titre.strategy';

// Dates et nombres au format français ; les montants utilisent le pipe « montant » (devise de la clinique).
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    provideRouter(routes),
    { provide: TitleStrategy, useClass: TitreStrategy },
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
