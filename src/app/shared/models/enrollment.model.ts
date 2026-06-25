/**
 * Modèles du domaine « inscription aux langues » — contrat d'API avec le
 * QUIZ SERVICE (routé : /api/enrollments/**). Miroir des DTOs Java.
 */

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED';

export const LANGUAGE_LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Seuil de réussite (promotion au niveau suivant). */
export const PASS_THRESHOLD = 80;

/** 🔌 QUIZ SERVICE — GET /api/enrollments/me (EnrollmentDto). */
export interface Enrollment {
  categoryId: number;
  categoryName: string;
  icon: string;
  color: string;
  currentLevel: LanguageLevel;
  /** Rang 1..6 du niveau courant (barre de progression). */
  currentLevelRank: number;
  /** Dernier score (%) sur le niveau courant. */
  score: number;
  status: EnrollmentStatus;
  teacherName: string;
  /** Niveau suivant ("B1"), ou null si au maximum (C2). */
  nextLevel: LanguageLevel | null;
  atMaxLevel: boolean;
}

/** 🔌 QUIZ SERVICE — GET /api/enrollments/admin/stats (AdminEnrollmentStatsDto). */
export interface AdminEnrollmentStats {
  totalCategories: number;
  totalEnrollments: number;
  distinctStudents: number;
  averageScore: number;
}

export type EnrollmentAuditAction = 'ENROLLED' | 'ATTEMPT' | 'LEVEL_UP';

/** 🔌 QUIZ SERVICE — GET /api/enrollments/me/{categoryId}/history (EnrollmentAuditDto). */
export interface EnrollmentAudit {
  action: EnrollmentAuditAction;
  fromLevel: LanguageLevel | null;
  toLevel: LanguageLevel | null;
  score: number | null;
  /** ISO 8601 */
  at: string;
}
