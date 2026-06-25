import {Component, inject, OnInit} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import { QuizService }   from '../services/quiz.service';
import { QuizResult }    from '@shared/models/quiz-question.model';

@Component({
  selector: 'app-result-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-page.component.html',
  styleUrls: ['./result-page.component.css'],
})
export class ResultPageComponent implements OnInit {

  readonly quiz   = inject(QuizService);
  readonly router = inject(Router);

  result!: QuizResult;

  ngOnInit(): void {
    if (!this.quiz.quizFinished()) {
      this.router.navigate(['/category']);
      return;
    }
    // Affichage local immédiat ; l'enregistrement officiel est déjà parti
    // vers l'Assessment Service (QuizService.submitToBackend à la fin du quiz).
    this.result = this.quiz.getResult();
  }

  getScoreLabel(): { text: string; emoji: string } {
    const s = this.result.score;
    if (s >= 90) return { text: 'Excellent !',        emoji: '🏆' };
    if (s >= 75) return { text: 'Très bien !',        emoji: '🎉' };
    if (s >= 60) return { text: 'Bien joué !',        emoji: '👍' };
    if (s >= 40) return { text: 'Peut mieux faire.',  emoji: '💪' };
    return             { text: 'Continue à pratiquer.', emoji: '📚' };
  }

  getScoreColor(): string {
    const s = this.result.score;
    if (s >= 75) return 'var(--success)';
    if (s >= 50) return 'var(--warning)';
    return 'var(--danger)';
  }

  retry(): void {
    this.quiz.startQuiz();
    this.router.navigate(['/quizs']);
  }

  changeCategory(): void {
    this.quiz.resetQuiz();
    this.router.navigate(['/category']);
  }
}
