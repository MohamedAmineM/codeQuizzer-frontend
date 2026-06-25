import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizService } from '../services/quiz.service';

const QUESTION_TIME = 30; // secondes par question
const TIMER_RADIUS = 26;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

@Component({
  selector: 'app-quiz-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-page.component.html',
  styleUrls: ['./quiz-page.component.css'],
})
export class QuizPageComponent implements OnInit, OnDestroy {

  readonly quiz   = inject(QuizService);
  readonly router = inject(Router);

  readonly circumference = TIMER_CIRCUMFERENCE;

  selectedOptionIndex = signal<number | null>(null);
  showExplication     = signal<boolean>(false);
  answered            = signal<boolean>(false);
  timeLeft            = signal<number>(QUESTION_TIME);
  timedOut            = signal<boolean>(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  isCorrect = computed(() => {
    const sel = this.selectedOptionIndex();
    const q   = this.quiz.currentQuestion();
    return sel !== null && q ? sel === q.correctAnswer : false;
  });

  /** Couleur du timer : vert > 15s, orange 5-15s, rouge < 5s */
  timerColor = computed(() => {
    const t = this.timeLeft();
    if (t > 15) return 'var(--success)';
    if (t >= 5) return 'var(--warning)';
    return 'var(--danger)';
  });

  timerOffset = computed(() =>
    TIMER_CIRCUMFERENCE * (1 - this.timeLeft() / QUESTION_TIME)
  );

  categoryInfo = computed(() =>
    this.quiz.getCategoryInfo(this.quiz.selectedCategory())
  );

  ngOnInit(): void {
    if (!this.quiz.quizStarted()) {
      this.router.navigate(['/category']);
      return;
    }
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ── Timer ────────────────────────────────────────────────────────
  private startTimer(): void {
    this.stopTimer();
    this.timeLeft.set(QUESTION_TIME);
    this.timedOut.set(false);
    this.timerId = setInterval(() => {
      const t = this.timeLeft() - 1;
      this.timeLeft.set(t);
      if (t <= 0) this.onTimeout();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Temps écoulé : question comptée incorrecte, passage automatique */
  private onTimeout(): void {
    this.stopTimer();
    this.timedOut.set(true);
    this.answered.set(true);
    this.quiz.answerQuestion(-1);
    setTimeout(() => this.next(), 1600);
  }

  // ── Interactions ─────────────────────────────────────────────────
  selectOption(index: number): void {
    if (this.answered()) return;
    this.stopTimer();
    this.selectedOptionIndex.set(index);
    this.answered.set(true);
    this.quiz.answerQuestion(index);
  }

  next(): void {
    this.quiz.nextQuestion();
    if (this.quiz.quizFinished()) {
      this.stopTimer();
      this.router.navigate(['/result']);
    } else {
      this.resetQuestionState();
      this.startTimer();
    }
  }

  skip(): void {
    if (this.answered()) return;
    this.stopTimer();
    this.quiz.skipQuestion();
    if (this.quiz.quizFinished()) {
      this.router.navigate(['/result']);
    } else {
      this.resetQuestionState();
      this.startTimer();
    }
  }

  private resetQuestionState(): void {
    this.selectedOptionIndex.set(null);
    this.showExplication.set(false);
    this.answered.set(false);
    this.timedOut.set(false);
  }

  toggleExplication(): void {
    this.showExplication.update(v => !v);
  }

  getOptionClass(index: number): string {
    if (!this.answered()) return 'option';
    const q = this.quiz.currentQuestion();
    if (!q) return 'option';
    if (index === q.correctAnswer) return 'option correct';
    if (index === this.selectedOptionIndex()) return 'option wrong';
    return 'option dimmed';
  }

  quit(): void {
    this.stopTimer();
    this.quiz.resetQuiz();
    this.router.navigate(['/category']);
  }
}
