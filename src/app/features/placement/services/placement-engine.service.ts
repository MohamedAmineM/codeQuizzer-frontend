import { Injectable, computed, signal } from '@angular/core';
import { PASSAGES, QUESTIONS } from '../data/question-bank';
import {
  AnswerConfidence, AnsweredItem, CefrLevel, CEFR_LEVELS, FOCUS_BY_SKILL,
  IMPROVEMENT_PHRASE, Passage, PlacementResult, Question, SectionId, SectionResult,
  SkillId, SKILL_LABEL, STRENGTH_PHRASE, cefrRank, rankToCefr,
} from '../models/placement.model';

/** Ordre de passage des sections. */
const SECTION_ORDER: SectionId[] = ['grammar', 'vocabulary', 'reading', 'listening', 'usage'];

/** Nombre de questions par section (reading = nombre de questions du passage choisi). */
const SECTION_BUDGET: Record<SectionId, number> = {
  grammar: 7, vocabulary: 6, reading: 3, listening: 5, usage: 4,
};

/** Estimation de départ ≈ A2/B1, puis la difficulté s'adapte. */
const START_ESTIMATE = 2.6;

/** Poids des sections dans le niveau global (usage/grammaire légèrement renforcés). */
const SECTION_WEIGHT: Record<SectionId, number> = {
  grammar: 1.2, vocabulary: 1.1, reading: 1.0, listening: 1.0, usage: 1.1,
};

interface SectionRun {
  section: SectionId;
  estimate: number;
  step: number;
  lastDir: 0 | 1 | -1;
  asked: number;
  items: AnsweredItem[];
  usedIds: Set<string>;
  passage?: Passage;
  passageQueue: Question[];
}

interface SubmitOutcome {
  done: boolean;
  sectionChanged: boolean;
  result: PlacementResult | null;
}

/**
 * Moteur d'assessment adaptatif basé sur des règles.
 *
 * Principe : chaque section maintient une estimation d'aptitude (1..6). On sert
 * la question non utilisée dont le niveau est le plus proche de l'estimation ;
 * une bonne réponse augmente l'estimation, une mauvaise la diminue (pas adaptatif
 * dans un même passage de lecture). Le pas se réduit à chaque changement de
 * direction → convergence rapide façon recherche dichotomique. L'estimation est
 * reportée d'une section à l'autre pour démarrer au bon niveau.
 */
@Injectable({ providedIn: 'root' })
export class PlacementEngineService {

  private studentId = '';
  private studentName = '';
  private language = 'English';
  private startedAt = 0;
  private sectionIdx = 0;
  private run!: SectionRun;
  private readonly results: SectionResult[] = [];

  readonly currentQuestion = signal<Question | null>(null);
  readonly currentPassage = signal<Passage | null>(null);
  readonly sectionIndex = signal(0);
  readonly askedInSection = signal(0);
  readonly totalAnswered = signal(0);
  readonly finished = signal(false);
  readonly result = signal<PlacementResult | null>(null);

  readonly totalQuestions = Object.values(SECTION_BUDGET).reduce((a, b) => a + b, 0);
  readonly progress = computed(() => this.totalAnswered() / this.totalQuestions);
  readonly sectionBudget = computed(() => {
    const s = SECTION_ORDER[this.sectionIndex()];
    return s === 'reading' ? (this.run?.passageQueue.length ?? 3) : SECTION_BUDGET[s];
  });
  readonly sectionOrder = SECTION_ORDER;

  // ── Cycle de vie ──────────────────────────────────────────────────
  start(opts: { studentId: string; studentName: string; language?: string }): void {
    this.studentId = opts.studentId;
    this.studentName = opts.studentName;
    this.language = opts.language ?? 'English';
    this.startedAt = Date.now();
    this.sectionIdx = 0;
    this.results.length = 0;
    this.totalAnswered.set(0);
    this.finished.set(false);
    this.result.set(null);
    this.initSection(0, START_ESTIMATE);
    this.serveNext();
  }

  reset(): void {
    this.currentQuestion.set(null);
    this.currentPassage.set(null);
    this.finished.set(false);
    this.result.set(null);
    this.totalAnswered.set(0);
    this.sectionIndex.set(0);
    this.askedInSection.set(0);
  }

  submit(answerIndex: number, confidence?: AnswerConfidence): SubmitOutcome {
    const q = this.currentQuestion();
    if (!q) return { done: true, sectionChanged: false, result: this.result() };

    const correct = answerIndex === q.answer;
    this.run.items.push({ questionId: q.id, section: q.section, level: q.level, correct, confidence });
    this.run.usedIds.add(q.id);
    this.run.asked++;
    this.totalAnswered.update((n) => n + 1);
    this.updateEstimate(correct);

    const budget = this.run.section === 'reading' ? this.run.passageQueue.length : SECTION_BUDGET[this.run.section];

    // Encore des questions dans la section ?
    if (this.run.asked < budget) {
      const next = this.selectNext();
      if (next) { this.serve(next); return { done: false, sectionChanged: false, result: null }; }
    }

    // Section terminée → on la clôture.
    this.finalizeSection();

    if (this.sectionIdx + 1 < SECTION_ORDER.length) {
      this.sectionIdx++;
      this.initSection(this.sectionIdx, this.run.estimate);
      this.serveNext();
      return { done: false, sectionChanged: true, result: null };
    }

    // Assessment terminé → rapport.
    const report = this.buildResult();
    this.result.set(report);
    this.finished.set(true);
    this.currentQuestion.set(null);
    this.currentPassage.set(null);
    return { done: true, sectionChanged: false, result: report };
  }

  // ── Sélection adaptative ──────────────────────────────────────────
  private initSection(idx: number, estimate: number): void {
    const section = SECTION_ORDER[idx];
    const run: SectionRun = {
      section, estimate, step: 1.4, lastDir: 0, asked: 0, items: [], usedIds: new Set(), passageQueue: [],
    };
    if (section === 'reading') {
      const target = Math.round(this.clamp(estimate));
      const passage = [...PASSAGES].sort(
        (a, b) => Math.abs(cefrRank(a.level) - target) - Math.abs(cefrRank(b.level) - target),
      )[0];
      run.passage = passage;
      run.passageQueue = QUESTIONS.filter((q) => q.passageId === passage.id);
    }
    this.run = run;
    this.sectionIndex.set(idx);
    this.askedInSection.set(0);
  }

  private selectNext(): Question | null {
    const { section } = this.run;
    if (section === 'reading') {
      return this.run.passageQueue[this.run.asked] ?? null;
    }
    const target = Math.round(this.clamp(this.run.estimate));
    const candidates = QUESTIONS.filter((q) => q.section === section && !this.run.usedIds.has(q.id));
    if (candidates.length === 0) return null;
    return candidates.sort(
      (a, b) => Math.abs(cefrRank(a.level) - target) - Math.abs(cefrRank(b.level) - target),
    )[0];
  }

  private serveNext(): void {
    const next = this.selectNext();
    if (next) this.serve(next);
  }

  private serve(q: Question): void {
    this.currentQuestion.set(q);
    this.currentPassage.set(this.run.passage ?? null);
    this.askedInSection.set(this.run.asked);
  }

  private updateEstimate(correct: boolean): void {
    const dir: 1 | -1 = correct ? 1 : -1;
    if (this.run.lastDir !== 0 && dir !== this.run.lastDir) {
      this.run.step = Math.max(this.run.step * 0.6, 0.4);
    }
    this.run.estimate = this.clamp(this.run.estimate + dir * this.run.step);
    this.run.lastDir = dir;
  }

  private clamp(v: number): number { return Math.min(6, Math.max(1, v)); }

  // ── Scoring & rapport ─────────────────────────────────────────────
  private finalizeSection(): void {
    const { items, estimate, section } = this.run;
    const weight = items.reduce((s, it) => s + cefrRank(it.level), 0) || 1;
    const earned = items.reduce((s, it) => s + (it.correct ? cefrRank(it.level) : 0), 0);
    const raw = earned / weight;                       // 0..1
    const score = Math.round(35 + raw * 65);           // 35..100
    this.results.push({
      section, estimate, score, asked: items.length,
      correct: items.filter((i) => i.correct).length, items,
    });
  }

  private buildResult(): PlacementResult {
    const skills = {} as Record<SkillId, number>;
    for (const r of this.results) skills[r.section] = r.score;

    // Niveau global = moyenne pondérée des estimations de section.
    const wSum = this.results.reduce((s, r) => s + SECTION_WEIGHT[r.section], 0);
    const overallEstimate = this.results.reduce(
      (s, r) => s + r.estimate * SECTION_WEIGHT[r.section], 0,
    ) / wSum;
    const level = rankToCefr(overallEstimate);

    // Confiance : forte si les sections concordent (faible dispersion).
    const estimates = this.results.map((r) => r.estimate);
    const spread = Math.max(...estimates) - Math.min(...estimates);
    const scoreVals = Object.values(skills);
    const skillSpread = (Math.max(...scoreVals) - Math.min(...scoreVals)) / 100;
    const confidence = Math.min(99, Math.max(62, Math.round(95 - spread * 7 - skillSpread * 22)));

    // Forces / axes de progrès autour de la moyenne.
    const avg = scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length;
    const ranked = (Object.keys(skills) as SkillId[]).sort((a, b) => skills[b] - skills[a]);
    const strongSkills = ranked.filter((s) => skills[s] >= avg).slice(0, 3);
    let weakSkills = ranked.filter((s) => skills[s] < avg).reverse().slice(0, 3);
    if (weakSkills.length === 0) weakSkills = [ranked[ranked.length - 1]];

    const strengths = strongSkills.map((s) => STRENGTH_PHRASE[s]);
    const improvements = weakSkills.map((s) => IMPROVEMENT_PHRASE[s]);

    // Classe recommandée + alternative selon la position dans le niveau.
    const recommendedClass = `${this.language} ${level} Group`;
    const alternativeClass = this.buildAlternative(overallEstimate, level);

    // Focus d'apprentissage = compétences les plus faibles → activités.
    const learningFocus = [...new Set(weakSkills.flatMap((s) => FOCUS_BY_SKILL[s]))].slice(0, 3);

    const teacherInsight = this.buildInsight(strongSkills, weakSkills);

    return {
      id: `${this.studentId}-${this.startedAt}`,
      studentId: this.studentId,
      studentName: this.studentName,
      language: this.language,
      level, confidence, skills,
      sections: this.results.map((r) => ({ ...r })),
      strengths, improvements, recommendedClass, alternativeClass, learningFocus, teacherInsight,
      completedAt: new Date().toISOString(),
      durationSec: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      status: 'pending',
    };
  }

  private buildAlternative(estimate: number, level: CefrLevel): string {
    const rank = cefrRank(level);
    const frac = estimate - Math.floor(estimate);
    const lower = CEFR_LEVELS[rank - 2];
    const upper = CEFR_LEVELS[rank];
    if (frac < 0.5 && lower) return `High ${lower} / Low ${level}`;
    if (frac >= 0.5 && upper) return `High ${level} / Low ${upper}`;
    return `${level} (solid)`;
  }

  private buildInsight(strong: SkillId[], weak: SkillId[]): string {
    const phrase = (ids: SkillId[]) => {
      const labels = ids.map((s) => (s === 'usage' ? 'practical communication' : SKILL_LABEL[s].toLowerCase()));
      if (labels.length <= 1) return labels[0] ?? 'core skills';
      return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
    };
    return `The student demonstrates strong ${phrase(strong.slice(0, 2))} but may require ` +
      `additional support in ${phrase(weak.slice(0, 2))} activities.`;
  }
}
