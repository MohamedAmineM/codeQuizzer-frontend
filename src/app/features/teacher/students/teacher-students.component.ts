import { Component, computed, inject, signal } from '@angular/core';
import { TeacherStudentsService } from './teacher-students.service';
import { LanguageLevel, LANGUAGE_LEVELS } from '@shared/models/enrollment.model';

type LevelFilter = 'ALL' | LanguageLevel;

/**
 * Dashboard enseignant « My Students » : KPIs (total / actifs / score moyen) +
 * table des étudiants inscrits dans ses catégories, avec recherche et filtres
 * par niveau et par score. Données : GET /api/enrollments/teacher.
 */
@Component({
  selector: 'app-teacher-students',
  imports: [],
  templateUrl: './teacher-students.component.html',
  styleUrl: './teacher-students.component.css',
})
export class TeacherStudentsComponent {

  readonly svc = inject(TeacherStudentsService);

  readonly levels = LANGUAGE_LEVELS;

  readonly search = signal('');
  readonly levelFilter = signal<LevelFilter>('ALL');
  readonly minScore = signal(0);

  readonly minScoreOptions = [
    { value: 0, label: 'Tous les scores' },
    { value: 50, label: '≥ 50%' },
    { value: 80, label: '≥ 80% (éligibles)' },
  ];

  readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const lvl = this.levelFilter();
    const min = this.minScore();
    return this.svc.data().students.filter((s) => {
      const matchesSearch = q === ''
        || s.studentName.toLowerCase().includes(q)
        || s.categoryName.toLowerCase().includes(q);
      const matchesLevel = lvl === 'ALL' || s.currentLevel === lvl;
      const matchesScore = s.score >= min;
      return matchesSearch && matchesLevel && matchesScore;
    });
  });

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onMinScore(event: Event): void {
    this.minScore.set(Number((event.target as HTMLSelectElement).value));
  }

  initials(name: string): string {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase() || '?';
  }
}
