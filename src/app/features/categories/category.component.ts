import { Component, inject } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { Router }             from '@angular/router';
import { QuizService }        from '@features/quiz/services/quiz.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent {
  readonly quiz   = inject(QuizService);
  readonly router = inject(Router);

  /** Sélection = préchargement du quiz + questions depuis le Quiz Service. */
  selectCategory(cat: string): void {
    this.quiz.selectCategory(cat);
  }

  startQuiz(): void {
    this.quiz.startQuiz();
    this.router.navigate(['/quizs']);
  }

  getQuestionCount(): number {
    const loaded = this.quiz.currentQuestions().length;
    if (loaded > 0) return loaded;
    const info = this.quiz.getCategoryInfo(this.quiz.selectedCategory());
    return Math.min(20, info?.questionCount ?? 0);
  }
}
