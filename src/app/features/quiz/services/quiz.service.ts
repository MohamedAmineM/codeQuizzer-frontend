import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryInfo, QuizQuestion, QuizResult, QuizSummary, UserAnswer } from '@shared/models/quiz-question.model';
import { ResultService } from '@features/results/services/result.service';

/**
 * Flux de quiz — branché sur le QUIZ SERVICE via le gateway :
 *  - catégories  → GET {apiUrl}/api/categories
 *  - quiz        → GET {apiUrl}/api/quizzes?category=...
 *  - questions   → GET {apiUrl}/api/quizzes/{id}/questions
 *
 * À la fin du quiz, les réponses brutes sont envoyées à l'ASSESSMENT
 * SERVICE (via ResultService.submit) qui corrige côté serveur et remplit
 * les 3 tables (quiz_attempt, attempt_answer, user_stats).
 */
@Injectable({ providedIn: 'root' })
export class QuizService {

  private readonly http = inject(HttpClient);
  private readonly results = inject(ResultService);
  private readonly base = `${environment.apiUrl}/api`;

  // ── Catalogue (Quiz Service) ─────────────────────────────────────
  readonly categoriesLoading = signal(true);
  readonly categories = signal<CategoryInfo[]>([]);
  readonly questionsLoading = signal(false);

  // ── État de la partie en cours ───────────────────────────────────
  readonly selectedCategory = signal<string>('');
  readonly currentQuizId = signal<number | null>(null);

  private readonly questions = signal<QuizQuestion[]>([]);
  currentIndex  = signal<number>(0);
  userAnswers   = signal<UserAnswer[]>([]);
  quizStarted   = signal<boolean>(false);
  quizFinished  = signal<boolean>(false);

  /** Horodatage du démarrage — envoyé au backend avec la soumission. */
  private startedAt = '';

  currentQuestions = computed(() => this.questions());

  currentQuestion = computed(() => this.questions()[this.currentIndex()]);

  progress = computed(() => {
    const total = this.questions().length;
    return {
      current: this.currentIndex() + 1,
      total,
      percent: total === 0 ? 0 : (this.currentIndex() / total) * 100,
    };
  });

  constructor() {
    this.loadCategories();
  }

  // ── Catalogue ────────────────────────────────────────────────────
  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.http.get<CategoryInfo[]>(`${this.base}/categories`).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.categoriesLoading.set(false);
      },
      error: () => this.categoriesLoading.set(false),
    });
  }

  getCategories(): CategoryInfo[] {
    return this.categories();
  }

  getCategoryInfo(cat: string): CategoryInfo | undefined {
    return this.categories().find((c) => c.name === cat);
  }

  /** Sélectionne une catégorie et précharge le quiz + ses questions. */
  selectCategory(cat: string): void {
    if (this.selectedCategory() === cat && this.questions().length > 0) return;
    this.selectedCategory.set(cat);
    this.questionsLoading.set(true);
    this.http.get<QuizSummary[]>(`${this.base}/quizzes`, { params: { category: cat } }).pipe(
      switchMap((quizzes) => {
        const quiz = quizzes[0];
        if (!quiz) throw new Error(`Aucun quiz publié pour la catégorie ${cat}`);
        this.currentQuizId.set(quiz.id);
        return this.http.get<QuizQuestion[]>(`${this.base}/quizzes/${quiz.id}/questions`);
      })
    ).subscribe({
      next: (qs) => {
        this.questions.set(this.shuffle(qs).slice(0, 20));
        this.questionsLoading.set(false);
      },
      error: () => {
        this.questions.set([]);
        this.currentQuizId.set(null);
        this.questionsLoading.set(false);
      },
    });
  }

  /**
   * Charge le quiz d'un niveau de langue précis : GET /api/quizzes?category&level.
   * Émet true si un quiz + ses questions sont prêts (sinon false). Utilisé par
   * « My Languages » pour lancer l'évaluation du niveau courant de l'étudiant.
   */
  loadLevelQuiz(category: string, level: string): Observable<boolean> {
    this.selectedCategory.set(category);
    this.questionsLoading.set(true);
    this.questions.set([]);
    this.currentQuizId.set(null);
    return this.http.get<QuizSummary[]>(`${this.base}/quizzes`, { params: { category, level } }).pipe(
      switchMap((quizzes) => {
        const quiz = quizzes[0];
        if (!quiz) return of(false);
        this.currentQuizId.set(quiz.id);
        return this.http.get<QuizQuestion[]>(`${this.base}/quizzes/${quiz.id}/questions`).pipe(
          map((qs) => {
            this.questions.set(this.shuffle(qs).slice(0, 20));
            return true;
          })
        );
      }),
      tap(() => this.questionsLoading.set(false)),
      catchError(() => {
        this.questions.set([]);
        this.currentQuizId.set(null);
        this.questionsLoading.set(false);
        return of(false);
      })
    );
  }

  // ── Partie ───────────────────────────────────────────────────────
  startQuiz(): void {
    this.currentIndex.set(0);
    this.userAnswers.set([]);
    this.quizStarted.set(true);
    this.quizFinished.set(false);
    this.startedAt = new Date().toISOString();
  }

  answerQuestion(selectedOption: number): void {
    const q = this.currentQuestion();
    if (!q) return;

    const answer: UserAnswer = {
      questionId:     q.id,
      selectedOption,
      isCorrect:      selectedOption === q.correctAnswer,
    };

    this.userAnswers.update(prev => [...prev, answer]);
  }

  nextQuestion(): void {
    const next = this.currentIndex() + 1;
    if (next >= this.questions().length) {
      this.quizFinished.set(true);
      this.submitToBackend();
    } else {
      this.currentIndex.set(next);
    }
  }

  skipQuestion(): void {
    this.answerQuestion(-1);
    this.nextQuestion();
  }

  getResult(): QuizResult {
    const answers  = this.userAnswers();
    const correct  = answers.filter(a => a.isCorrect).length;
    const total    = this.questions().length;
    return {
      category:       this.selectedCategory(),
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers:   answers.length - correct,
      score:          total === 0 ? 0 : Math.round((correct / total) * 100),
      answers,
    };
  }

  resetQuiz(): void {
    this.currentIndex.set(0);
    this.userAnswers.set([]);
    this.quizStarted.set(false);
    this.quizFinished.set(false);
  }

  /**
   * Fin de quiz → POST /api/assessments/results (une seule fois par partie).
   * Le backend corrige avec le corrigé interne du Quiz Service et remplit
   * quiz_attempt + attempt_answer + user_stats pour l'utilisateur connecté.
   */
  private submitToBackend(): void {
    const quizId = this.currentQuizId();
    if (quizId === null || this.userAnswers().length === 0) return;
    this.results.submit(quizId, this.startedAt, this.userAnswers());
  }

  private shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }
}
