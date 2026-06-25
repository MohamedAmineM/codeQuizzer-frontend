import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EnrollmentService } from '../services/enrollment.service';
import { QuizService } from '@features/quiz/services/quiz.service';
import { ToastService } from '@core/services/toast.service';
import { Enrollment, EnrollmentAudit, LANGUAGE_LEVELS, PASS_THRESHOLD } from '@shared/models/enrollment.model';

/**
 * Écran « My Languages » de l'étudiant : une carte par langue inscrite avec
 * niveau courant, progression, enseignant, exigence du niveau suivant, et
 * historique de progression. Le bouton « Passer l'évaluation » lance le quiz
 * du niveau courant (→ correction Assessment → progression automatique).
 */
@Component({
  selector: 'app-my-languages',
  imports: [RouterLink, DatePipe],
  templateUrl: './my-languages.component.html',
  styleUrl: './my-languages.component.css',
})
export class MyLanguagesComponent {

  readonly enrollment = inject(EnrollmentService);
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly levels = LANGUAGE_LEVELS;
  readonly passThreshold = PASS_THRESHOLD;

  /** categoryId en cours de lancement de quiz. */
  readonly launching = signal<number | null>(null);
  /** categoryId dont l'historique est ouvert. */
  readonly openHistory = signal<number | null>(null);
  private readonly historyByCat = signal<Record<number, EnrollmentAudit[]>>({});

  history(categoryId: number): EnrollmentAudit[] {
    return this.historyByCat()[categoryId] ?? [];
  }

  toggleHistory(e: Enrollment): void {
    if (this.openHistory() === e.categoryId) {
      this.openHistory.set(null);
      return;
    }
    this.openHistory.set(e.categoryId);
    if (!this.historyByCat()[e.categoryId]) {
      this.enrollment.history(e.categoryId).subscribe({
        next: (h) => this.historyByCat.update((m) => ({ ...m, [e.categoryId]: h })),
        error: () => { /* errorInterceptor a déjà notifié */ },
      });
    }
  }

  startAssessment(e: Enrollment): void {
    this.launching.set(e.categoryId);
    this.quiz.loadLevelQuiz(e.categoryName, e.currentLevel).subscribe({
      next: (ready) => {
        this.launching.set(null);
        if (ready) {
          this.quiz.startQuiz();
          this.router.navigate(['/quizs']);
        } else {
          this.toast.info(`Aucun quiz ${e.currentLevel} disponible pour ${e.categoryName} pour l'instant.`);
        }
      },
      error: () => {
        this.launching.set(null);
        this.toast.error('Erreur de chargement du quiz.');
      },
    });
  }
}
