import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { PlacementEngineService } from './services/placement-engine.service';
import { PlacementApiService } from './services/placement-api.service';
import { AnswerConfidence, PlacementResult, SKILLS, SkillMeta } from './models/placement.model';
import { AudioPlayerComponent } from './components/audio-player.component';

type Step = 'intro' | 'section' | 'question';

interface AreaChip { label: string; icon: string; }

const QTYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple choice', synonym: 'Synonym', 'fill-blank': 'Fill in the blank',
  reading: 'Reading', listening: 'Listening',
};

const SECTION_BLURB: Record<string, string> = {
  grammar: 'Verb tenses, articles, prepositions, conditionals, passive voice and reported speech.',
  vocabulary: 'Everyday, work, travel, academic and business vocabulary.',
  reading: 'Read short passages and answer questions on meaning, detail and context.',
  listening: 'Listen to short clips and answer — you have a limited number of plays.',
  usage: 'Real-world situations: emails, bookings, interviews and professional communication.',
};

/**
 * Parcours étudiant du placement : onboarding → intro de section → questions
 * (adaptatif) → soumission au backend + redirection vers le rapport. Le résultat
 * est persisté côté serveur (plus de localStorage) ; le test ne peut être passé
 * qu'une seule fois (vérifié via {@link PlacementApiService#myResult}).
 */
@Component({
  selector: 'app-placement-home',
  imports: [AudioPlayerComponent, DatePipe],
  templateUrl: './placement-home.component.html',
  styleUrl: './placement-home.component.css',
})
export class PlacementHomeComponent {

  readonly engine = inject(PlacementEngineService);
  private readonly api = inject(PlacementApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('intro');
  readonly selected = signal<number | null>(null);
  readonly confidence = signal<AnswerConfidence | null>(null);

  readonly skills = SKILLS;
  readonly areas: AreaChip[] = [
    { label: 'Grammar', icon: 'spellcheck' },
    { label: 'Vocabulary', icon: 'menu_book' },
    { label: 'Reading', icon: 'chrome_reader_mode' },
    { label: 'Listening', icon: 'hearing' },
    { label: 'Language Usage', icon: 'forum' },
    { label: 'Communication Skills', icon: 'record_voice_over' },
  ];

  /** Résultat déjà obtenu (chargé du serveur) — le test est à usage unique. */
  readonly existingResult = signal<PlacementResult | null>(null);
  private readonly studentId = computed(() => this.auth.user()?.id ?? 'me');

  readonly sectionMeta = computed<SkillMeta>(() =>
    SKILLS.find((s) => s.id === this.engine.sectionOrder[this.engine.sectionIndex()])!);
  readonly sectionBlurb = computed(() => SECTION_BLURB[this.sectionMeta().id]);
  readonly qTypeLabel = computed(() => {
    const q = this.engine.currentQuestion();
    return q ? QTYPE_LABEL[q.type] : '';
  });

  constructor() {
    // Charge le placement existant : s'il y en a un, l'intro affiche le résultat (test unique).
    this.api.myResult().subscribe((r) => this.existingResult.set(r));
  }

  start(): void {
    if (this.existingResult()) return; // test une seule fois
    this.engine.start({
      studentId: this.studentId(),
      studentName: this.auth.fullName() || this.auth.user()?.username || 'Student',
      language: 'English',
    });
    this.step.set('section');
  }

  /** Voir le rapport détaillé (étudiant déjà placé). */
  viewResult(): void {
    void this.router.navigate(['/learning/placement/result']);
  }

  beginSection(): void {
    this.resetChoice();
    this.step.set('question');
  }

  choose(i: number): void { this.selected.set(i); }
  setConfidence(c: AnswerConfidence): void { this.confidence.set(c); }

  next(): void {
    if (this.selected() === null) return;
    const out = this.engine.submit(this.selected()!, this.confidence() ?? undefined);
    this.resetChoice();

    if (out.done && out.result) {
      // Persiste côté serveur ; le rapport se charge depuis /me. On y va dans tous les cas.
      this.api.submit(out.result).subscribe({
        next: () => this.router.navigate(['/learning/placement/result']),
        error: () => this.router.navigate(['/learning/placement/result']),
      });
      return;
    }
    if (out.sectionChanged) this.step.set('section');
  }

  private resetChoice(): void {
    this.selected.set(null);
    this.confidence.set(null);
  }
}
