import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { includeBearerTokenInterceptor } from 'keycloak-angular';
import { provideEchartsCore } from 'ngx-echarts';
import { provideKeycloakAngular } from './keycloak.config';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { LanguageService } from '@core/i18n/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloakAngular(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor, errorInterceptor])),
    // Phase 5 — ECharts (lazy core) for the Activity Report charts.
    provideEchartsCore({ echarts: () => import('echarts') }),
    // i18n — précharge la langue active (et applique dir/lang) avant le 1er rendu.
    provideAppInitializer(() => inject(LanguageService).init()),
]
};
