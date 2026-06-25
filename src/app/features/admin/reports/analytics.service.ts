import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ActivityReport, PeriodKey } from './analytics.model';

/**
 * Calls analytics-service through the gateway. The bearer token is attached by the global
 * keycloak interceptor; the gateway enforces ADMIN. Exposes signals consumed by the page.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/analytics`;

  readonly loading = signal(false);
  readonly report = signal<ActivityReport | null>(null);
  readonly error = signal<string | null>(null);

  analyze(period: PeriodKey): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<ActivityReport>(`${this.api}/report`, { params: { period } }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not generate the report. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
