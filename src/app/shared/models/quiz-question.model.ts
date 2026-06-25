/**
 * Modèles du flux de quiz — contrats d'API avec le QUIZ SERVICE
 * (microservice `quiz`, routé par le gateway : /api/categories/**, /api/quizzes/**).
 */

/** Catégorie dynamique — vient du référentiel du Quiz Service. */
export type QuizCategory = string;

/**
 * 🔌 QUIZ SERVICE — une question à jouer.
 * Réponse de GET {apiUrl}/api/quizzes/{id}/questions (QuestionDto).
 * ⚠️ correctAnswer/explanation sont exposés pour la correction immédiate
 * dans l'UI ; le score OFFICIEL est recalculé côté Assessment Service.
 */
export interface QuizQuestion {
  id: number;
  category?: QuizCategory;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

/**
 * 🔌 QUIZ SERVICE — résumé d'un quiz du catalogue.
 * Réponse de GET {apiUrl}/api/quizzes?category=... (QuizDto).
 */
export interface QuizSummary {
  id: number;
  title: string;
  category: string;
  questionsCount: number;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizResult {
  category: QuizCategory;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  answers: UserAnswer[];
  timeTaken?: number;
}

export type QuizDifficulty = string;

/**
 * 🔌 QUIZ SERVICE — carte de la page « Choisir une catégorie ».
 * Réponse de GET {apiUrl}/api/categories (CategoryDto).
 */
export interface CategoryInfo {
  id: number;
  name: QuizCategory;
  icon: string;
  description: string;
  questionCount: number;
  color: string;
  difficulty: QuizDifficulty;
  /** Présent pour les catégories « langue » assignées à un enseignant. */
  teacherId?: string;
  teacherName?: string;
}
