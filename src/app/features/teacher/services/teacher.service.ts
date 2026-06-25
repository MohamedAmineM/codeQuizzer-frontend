import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { TeacherDashboardStats, TeacherQuiz } from '@shared/models/teacher.model';

/**
 * ════════════════════════════════════════════════════════════════════
 * DOMAINE ENSEIGNANT — BRANCHÉ SUR LE QUIZ SERVICE RÉEL
 * ════════════════════════════════════════════════════════════════════
 *
 * Tout passe par le Spring Cloud Gateway ({apiUrl} = :8888) qui route
 * /api/quizzes/** vers le microservice QUIZ (:8082). Le token Keycloak est
 * attaché par includeBearerTokenInterceptor ; le backend identifie
 * l'enseignant via le claim `sub` du JWT (endpoint /mine) — jamais via un
 * paramètre client, donc chaque enseignant ne voit que SES quiz.
 *
 *  - mes quiz → QUIZ SERVICE : GET /api/quizzes/mine
 *  - KPIs     → dérivés localement de la liste (totalQuizzes, totalCategories)
 *
 * « Students reached » reste null tant que l'Assessment Service n'expose pas
 * l'audience par enseignant (nombre d'étudiants distincts ayant joué mes quiz).
 */
@Injectable({ providedIn: 'root' })
export class TeacherService {

  private readonly http = inject(HttpClient);
  private readonly quizUrl = `${environment.apiUrl}/api/quizzes`;
  private readonly assessmentUrl = `${environment.apiUrl}/api/assessments`;

  readonly loading = signal(true);
  readonly quizzes = signal<TeacherQuiz[]>([]);

  /** Audience — étudiants distincts ayant joué mes quiz (Assessment Service). */
  private readonly studentsReached = signal<number | null>(null);

  /** KPIs du dashboard, recalculés à partir des quiz de l'enseignant. */
  readonly stats = computed<TeacherDashboardStats>(() => {
    const qs = this.quizzes();
    return {
      totalQuizzes: qs.length,
      totalCategories: new Set(qs.map((q) => q.category)).size,
      studentsReached: this.studentsReached(),
    };
  });

  constructor() {
    this.load();
  }

  /** Charge les quiz de l'enseignant + son audience depuis le backend. */
  load(): void {
    this.loading.set(true);

    // Mes quiz (Quiz Service) — pilote le skeleton principal.
    this.http.get<TeacherQuiz[]>(`${this.quizUrl}/mine`).subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor — on sort du skeleton.
      error: () => this.loading.set(false),
    });

    // KPI « Students Reached » (Assessment Service) — chargé indépendamment ;
    // reste « — » en cas d'erreur (déjà notifiée par errorInterceptor).
    this.http.get<{ studentsReached: number }>(`${this.assessmentUrl}/quiz/students-reached`).subscribe({
      next: (r) => this.studentsReached.set(r.studentsReached),
      error: () => this.studentsReached.set(null),
    });
  }
}
