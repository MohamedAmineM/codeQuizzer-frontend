/** Modèles du domaine enseignant — futur Quiz Service / Assessment Service. */

import { LanguageLevel } from './enrollment.model';

export type QuizStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface TeacherQuiz {
  /** Id du quiz côté Quiz Service (Long). */
  id: number;
  title: string;
  category: string;
  questionsCount: number;
  /** ISO 8601 */
  createdAt: string;
  status: QuizStatus;
}

export interface TeacherDashboardStats {
  totalQuizzes: number;
  totalCategories: number;
  /** null tant que l'Assessment Service n'expose pas l'audience par enseignant. */
  studentsReached: number | null;
}

export const QUIZ_STATUS_META: Record<QuizStatus, { label: string; cssClass: string }> = {
  PUBLISHED: { label: 'Publié',   cssClass: 'badge-success' },
  DRAFT:     { label: 'Brouillon', cssClass: 'badge-warning' },
  ARCHIVED:  { label: 'Archivé',  cssClass: 'badge-muted' },
};

/**
 * 🔌 QUIZ SERVICE — GET /api/enrollments/teacher (TeacherStudentsDto).
 * Étudiants inscrits dans les catégories de l'enseignant connecté + KPIs.
 */
export interface TeacherStudentRow {
  studentName: string;
  categoryName: string;
  currentLevel: LanguageLevel;
  score: number;
  eligibleForPromotion: boolean;
  progressLabel: string;
}

export interface TeacherStudents {
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  students: TeacherStudentRow[];
}
