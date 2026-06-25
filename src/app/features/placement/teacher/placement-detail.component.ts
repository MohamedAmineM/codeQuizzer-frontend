import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ToastService } from '@core/services/toast.service';
import { PlacementApiService } from '../services/placement-api.service';
import { CEFR_LEVELS, CefrLevel, PlacementResult, SKILLS } from '../models/placement.model';
import { RadarChartComponent, RadarAxis } from '../components/radar-chart.component';

/**
 * Vue enseignant d'un placement. Radar en premier (vue d'ensemble immédiate),
 * puis insights, recommandation et gestion : approuver / ajuster / commenter.
 * Approuver ou ajuster déclenche une notification à l'étudiant (event-driven backend).
 */
@Component({
  selector: 'app-placement-detail',
  imports: [RouterLink, DatePipe, FormsModule, RadarChartComponent],
  templateUrl: './placement-detail.component.html',
  styleUrl: './placement-detail.component.css',
})
export class PlacementDetailComponent {

  /** Lié depuis la route (:id) via withComponentInputBinding. */
  readonly id = input<string>('');

  private readonly api = inject(PlacementApiService);
  private readonly toast = inject(ToastService);

  readonly levels = CEFR_LEVELS;
  readonly result = signal<PlacementResult | null>(null);

  readonly overrideLevel = signal<CefrLevel | ''>('');
  readonly comment = signal('');

  readonly skillRows = computed(() => {
    const r = this.result();
    if (!r) return [];
    return SKILLS.map((s) => ({ id: s.id, label: s.label, icon: s.icon, value: r.skills[s.id] ?? 0 }));
  });
  readonly radarAxes = computed<RadarAxis[]>(() =>
    this.skillRows().map((s) => ({ label: s.label, value: s.value })));

  constructor() {
    // Charge le placement depuis le serveur dès que l'id (route) est connu.
    effect(() => {
      const id = this.id();
      if (id) this.api.byId(id).subscribe((r) => this.result.set(r));
    });
    // Pré-remplit le commentaire / le niveau d'ajustement quand le résultat charge.
    effect(() => {
      const r = this.result();
      if (r) {
        this.comment.set(r.teacherComment ?? '');
        this.overrideLevel.set(r.finalLevel && r.finalLevel !== r.level ? r.finalLevel : '');
      }
    });
  }

  approve(): void {
    const r = this.result();
    if (!r) return;
    this.api.approve(r.id).subscribe({
      next: (updated) => {
        this.result.set(updated);
        this.toast.success(`Placement approved — ${updated.studentName} placed at ${updated.finalLevel ?? updated.level}.`);
      },
      error: () => this.toast.error('Could not approve placement.'),
    });
  }

  applyOverride(): void {
    const r = this.result();
    const lvl = this.overrideLevel();
    if (!r || !lvl) return;
    this.api.override(r.id, lvl).subscribe({
      next: (updated) => {
        this.result.set(updated);
        this.toast.success(`Placement adjusted to ${lvl} for ${updated.studentName}.`);
      },
      error: () => this.toast.error('Could not adjust placement.'),
    });
  }

  saveComment(): void {
    const r = this.result();
    if (!r) return;
    this.api.setComment(r.id, this.comment().trim()).subscribe({
      next: (updated) => { this.result.set(updated); this.toast.success('Comment saved.'); },
      error: () => this.toast.error('Could not save comment.'),
    });
  }

  scoreClass(v: number): string {
    if (v >= 80) return 'great';
    if (v >= 65) return 'good';
    if (v >= 50) return 'fair';
    return 'low';
  }
}
