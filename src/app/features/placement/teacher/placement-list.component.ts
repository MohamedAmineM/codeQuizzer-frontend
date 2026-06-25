import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PlacementApiService } from '../services/placement-api.service';
import { PlacementResult } from '../models/placement.model';

/**
 * Tableau de bord enseignant : tous les placements (dernier par étudiant) avec
 * KPI et recherche. Chaque ligne ouvre le rapport détaillé.
 */
@Component({
  selector: 'app-placement-list',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './placement-list.component.html',
  styleUrl: './placement-list.component.css',
})
export class PlacementListComponent {

  private readonly api = inject(PlacementApiService);

  readonly search = signal('');
  readonly placements = signal<PlacementResult[]>([]);

  constructor() {
    this.api.teacherList().subscribe((list) => this.placements.set(list));
  }

  readonly stats = computed(() => {
    const list = this.placements();
    const pending = list.filter((p) => p.status === 'pending').length;
    const avg = list.length
      ? Math.round(list.reduce((s, p) => s + p.confidence, 0) / list.length)
      : 0;
    return { total: list.length, pending, avg };
  });

  readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.placements();
    if (!q) return list;
    return list.filter((p) =>
      p.studentName.toLowerCase().includes(q) ||
      p.language.toLowerCase().includes(q) ||
      (p.finalLevel ?? p.level).toLowerCase().includes(q));
  });

  confClass(v: number): string {
    if (v >= 85) return 'great';
    if (v >= 70) return 'good';
    return 'fair';
  }
}
