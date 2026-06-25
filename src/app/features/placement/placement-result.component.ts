import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PlacementApiService } from './services/placement-api.service';
import { PlacementResult, SKILLS } from './models/placement.model';
import { RadarChartComponent, RadarAxis } from './components/radar-chart.component';

/**
 * Rapport de diagnostic de l'étudiant : niveau global, confiance, analyse par
 * compétence (barres + radar), forces, axes de progrès, classe recommandée,
 * focus d'apprentissage.
 */
@Component({
  selector: 'app-placement-result',
  imports: [RouterLink, DatePipe, RadarChartComponent],
  templateUrl: './placement-result.component.html',
  styleUrl: './placement-result.component.css',
})
export class PlacementResultComponent {

  private readonly api = inject(PlacementApiService);

  readonly result = signal<PlacementResult | null>(null);

  constructor() {
    this.api.myResult().subscribe((r) => this.result.set(r));
  }

  readonly skillRows = computed(() => {
    const r = this.result();
    if (!r) return [];
    return SKILLS.map((s) => ({ id: s.id, label: s.label, icon: s.icon, value: r.skills[s.id] ?? 0 }));
  });

  readonly radarAxes = computed<RadarAxis[]>(() =>
    this.skillRows().map((s) => ({ label: s.label, value: s.value })));

  /** Géométrie de l'anneau de confiance (SVG). */
  readonly ring = computed(() => {
    const c = 2 * Math.PI * 52;
    const conf = this.result()?.confidence ?? 0;
    return { circ: c, offset: c * (1 - conf / 100) };
  });

  scoreClass(v: number): string {
    if (v >= 80) return 'great';
    if (v >= 65) return 'good';
    if (v >= 50) return 'fair';
    return 'low';
  }
}
