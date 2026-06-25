import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Enrollment, EnrollmentAudit } from '@shared/models/enrollment.model';

/**
 * ════════════════════════════════════════════════════════════════════
 * INSCRIPTION AUX LANGUES — BRANCHÉ SUR LE QUIZ SERVICE
 * ════════════════════════════════════════════════════════════════════
 *
 * Passe par le Spring Cloud Gateway ({apiUrl} = :8888) → /api/enrollments/**
 * → microservice QUIZ. Le token Keycloak est attaché par
 * includeBearerTokenInterceptor ; le backend identifie l'étudiant via le
 * claim `sub` du JWT (endpoints /me) — jamais via un paramètre client.
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/enrollments`;

  readonly loading = signal(true);
  readonly enrollments = signal<Enrollment[]>([]);

  readonly hasEnrollments = computed(() => this.enrollments().length > 0);

  constructor() {
    this.load();
  }

  /** Charge les langues de l'étudiant connecté (écran « My Languages »). */
  load(): void {
    this.loading.set(true);
    this.http.get<Enrollment[]>(`${this.baseUrl}/me`).subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor — on sort du skeleton.
      error: () => this.loading.set(false),
    });
  }

  /** Inscrit l'étudiant aux catégories choisies (idempotent côté backend). */
  enroll(categoryIds: number[]): Observable<Enrollment[]> {
    return this.http.post<Enrollment[]>(this.baseUrl, { categoryIds });
  }

  /** Historique de progression d'une catégorie. */
  history(categoryId: number): Observable<EnrollmentAudit[]> {
    return this.http.get<EnrollmentAudit[]>(`${this.baseUrl}/me/${categoryId}/history`);
  }
}
