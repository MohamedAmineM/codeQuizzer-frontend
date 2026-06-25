import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryPerformance, LeaderboardEntry, QuizHistoryEntry, UserStats } from '@shared/models/result.model';
import { UserAnswer } from '@shared/models/quiz-question.model';

const EMPTY_STATS: UserStats = {
  quizzesCompleted: 0, totalQuestions: 0, totalCorrect: 0,
  bestScore: 0, successRate: 0, lastPlayedAt: null,
};

/**
 * ════════════════════════════════════════════════════════════════════
 * ÉCRAN « MES RÉSULTATS » — BRANCHÉ SUR LE BACKEND RÉEL
 * ════════════════════════════════════════════════════════════════════
 *
 * Tous les appels passent par le Spring Cloud Gateway ({apiUrl} = :8888)
 * qui route /api/assessments/** vers le microservice ASSESSMENT (:8084).
 * Le token Keycloak est attaché automatiquement par
 * includeBearerTokenInterceptor ; le backend identifie l'étudiant via le
 * claim `sub` du JWT (endpoints en /me) — jamais via un paramètre client.
 *
 *  - historique   → ASSESSMENT : GET /api/assessments/results/me
 *  - leaderboard  → ASSESSMENT : GET /api/assessments/leaderboard?limit=5
 *  - KPIs         → calcul local (ou GET /api/assessments/stats/me)
 *  - couleurs cat → QUIZ SERVICE (référentiel, encore codé en dur ici)
 */
@Injectable({ providedIn: 'root' })
export class ResultService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/assessments`;

  readonly loading = signal(true);
  readonly history = signal<QuizHistoryEntry[]>([]);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);

  /**
   * 🔌 ASSESSMENT SERVICE — read model user_stats (KPIs du Profil).
   * GET {apiUrl}/api/assessments/stats/me
   */
  readonly stats = signal<UserStats>(EMPTY_STATS);

  readonly successRate = computed(() => {
    const h = this.history();
    if (h.length === 0) return 0;
    return Math.round(h.reduce((sum, e) => sum + e.score, 0) / h.length);
  });

  readonly bestScore = computed(() =>
    this.history().reduce((max, e) => Math.max(max, e.score), 0)
  );

  readonly categoryPerformance = computed<CategoryPerformance[]>(() => {
    const byCat = new Map<string, { total: number; count: number }>();
    for (const e of this.history()) {
      const agg = byCat.get(e.category) ?? { total: 0, count: 0 };
      agg.total += e.score;
      agg.count += 1;
      byCat.set(e.category, agg);
    }
    return [...byCat.entries()].map(([category, agg]) => ({
      category,
      averageScore: Math.round(agg.total / agg.count),
      quizzesTaken: agg.count,
      color: CATEGORY_COLORS[category] ?? 'var(--primary)',
    }));
  });

  constructor() {
    this.load();
  }

  /** Charge l'historique + le leaderboard depuis l'Assessment Service. */
  load(): void {
    this.loading.set(true);
    forkJoin({
      history: this.http.get<QuizHistoryEntry[]>(`${this.baseUrl}/results/me`),
      leaderboard: this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`, { params: { limit: 5 } }),
      stats: this.http.get<UserStats>(`${this.baseUrl}/stats/me`),
    }).subscribe({
      next: ({ history, leaderboard, stats }) => {
        this.history.set(history);
        this.leaderboard.set(leaderboard);
        this.stats.set(stats);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor — on sort du skeleton.
      error: () => this.loading.set(false),
    });
  }

  /**
   * Fin de quiz : envoie les réponses BRUTES à l'Assessment Service
   * (POST /api/assessments/results). Le backend récupère le corrigé auprès
   * du Quiz Service, calcule le score officiel et remplit les 3 tables
   * (quiz_attempt, attempt_answer, user_stats) pour l'utilisateur du JWT.
   * Appelé automatiquement par QuizService à la fin de chaque partie.
   */
  submit(quizId: number, startedAt: string, answers: UserAnswer[]): void {
    const body = {
      quizId,
      startedAt,
      answers: answers.map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
    };
    this.http.post<QuizHistoryEntry>(`${this.baseUrl}/results`, body).subscribe({
      // Recharge pour que l'écran « Mes résultats » reflète la nouvelle tentative.
      next: () => this.load(),
      error: () => { /* 401/403/réseau : déjà notifié par errorInterceptor */ },
    });
  }
}

/**
 * 🔌 QUIZ SERVICE — référentiel temporaire des couleurs de catégories.
 * À remplacer quand GET {apiUrl}/api/categories fournira { name, color }.
 */
const CATEGORY_COLORS: Record<string, string> = {
  'Java':        '#b45309',
  'Angular':     '#dc2626',
  'Spring Boot': '#16a34a',
  'SQL':         '#0284c7',
  'DevOps':      '#7c3aed',
};
