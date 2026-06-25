/**
 * Modèles de l'écran « Mes résultats » — contrats d'API avec l'ASSESSMENT SERVICE
 * (microservice `assessment`, routé par le gateway : /api/assessments/**).
 * Ces interfaces sont les miroirs des DTOs Java (QuizHistoryEntryDto, etc.).
 */

/**
 * 🔌 ASSESSMENT SERVICE — une ligne de l'historique.
 * Réponse de GET {apiUrl}/api/assessments/results/me
 * Côté backend : entité QuizAttempt (user_id = jwt.sub).
 * `quizTitle` / `category` sont dénormalisés depuis le QUIZ SERVICE au
 * moment de l'enregistrement du résultat.
 */
export interface QuizHistoryEntry {
  id: number;
  /** Référence vers le quiz (futur bouton « Rejouer »). */
  quizId: number;
  quizTitle: string;
  category: string;
  /** Score en pourcentage (0-100), calculé côté serveur. */
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  /** ISO 8601 */
  completedAt: string;
}

/**
 * 🧮 Agrégat par catégorie — calculé côté frontend à partir de l'historique.
 * `color` viendra du référentiel du QUIZ SERVICE (GET {apiUrl}/api/categories).
 */
export interface CategoryPerformance {
  category: string;
  averageScore: number;
  quizzesTaken: number;
  color: string;
}

/**
 * 🔌 ASSESSMENT SERVICE — statistiques agrégées de l'utilisateur connecté.
 * Réponse de GET {apiUrl}/api/assessments/stats/me (UserStatsDto).
 * Côté backend : read model user_stats, mis à jour à chaque quiz terminé.
 * Source unique des KPIs du Profil — plus aucun localStorage.
 */
export interface UserStats {
  quizzesCompleted: number;
  totalQuestions: number;
  totalCorrect: number;
  bestScore: number;
  /** Moyenne des scores (0-100). */
  successRate: number;
  /** ISO 8601 — null si aucun quiz joué. */
  lastPlayedAt: string | null;
}

/**
 * 🔌 ASSESSMENT SERVICE — entrée du classement global.
 * Réponse de GET {apiUrl}/api/assessments/leaderboard?limit=N
 * Agrégation cross-utilisateurs calculée côté backend, noms abrégés (RGPD).
 */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  quizzesCompleted: number;
}
