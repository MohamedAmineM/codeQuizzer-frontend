import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from '@features/quiz/services/quiz.service';
import { ToastService } from '@core/services/toast.service';
import { EnrollmentService } from '../services/enrollment.service';

/**
 * Écran de premier login : « Select the languages you want to learn ».
 * Affiche les catégories « langue » (celles assignées à un enseignant),
 * sélection multiple → POST /api/enrollments → redirection vers My Languages.
 */
@Component({
  selector: 'app-language-enroll',
  imports: [],
  templateUrl: './language-enroll.component.html',
  styleUrl: './language-enroll.component.css',
})
export class LanguageEnrollComponent {

  private readonly quiz = inject(QuizService);
  private readonly enrollment = inject(EnrollmentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = this.quiz.categoriesLoading;
  readonly saving = signal(false);

  /** Catégories « langue » = celles assignées à un enseignant. */
  readonly languages = computed(() => this.quiz.categories().filter((c) => !!c.teacherId));

  private readonly selectedIds = signal<Set<number>>(new Set<number>());
  readonly selectedCount = computed(() => this.selectedIds().size);

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: number): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  save(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.toast.info('Sélectionnez au moins une langue.');
      return;
    }
    this.saving.set(true);
    this.enrollment.enroll(ids).subscribe({
      next: () => {
        this.enrollment.load();
        this.toast.success('Vos langues ont été enregistrées !');
        this.router.navigate(['/languages']);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error("Échec de l'inscription. Réessayez.");
      },
    });
  }
}
