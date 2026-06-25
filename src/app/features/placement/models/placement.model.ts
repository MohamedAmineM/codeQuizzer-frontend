/**
 * Modèle du module « Language Placement Assessment ».
 * Assessment basé sur des règles (pas d'IA), adaptatif par section.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Rang numérique d'un niveau CEFR (A1 = 1 … C2 = 6). */
export const cefrRank = (l: CefrLevel): number => CEFR_LEVELS.indexOf(l) + 1;
/** Niveau CEFR le plus proche d'un rang continu (1..6). */
export const rankToCefr = (rank: number): CefrLevel =>
  CEFR_LEVELS[Math.min(5, Math.max(0, Math.round(rank) - 1))];

export type SkillId = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'usage';

export interface SkillMeta {
  id: SkillId;
  label: string;
  icon: string;
}

/** Les 5 compétences = les 5 sections de l'assessment (une par compétence). */
export const SKILLS: readonly SkillMeta[] = [
  { id: 'grammar',    label: 'Grammar',        icon: 'spellcheck' },
  { id: 'vocabulary', label: 'Vocabulary',     icon: 'menu_book' },
  { id: 'reading',    label: 'Reading',        icon: 'chrome_reader_mode' },
  { id: 'listening',  label: 'Listening',      icon: 'hearing' },
  { id: 'usage',      label: 'Language Usage', icon: 'forum' },
];

export const SKILL_LABEL: Record<SkillId, string> =
  SKILLS.reduce((acc, s) => ({ ...acc, [s.id]: s.label }), {} as Record<SkillId, string>);

export type SectionId = SkillId;
export type QuestionType = 'mcq' | 'synonym' | 'fill-blank' | 'reading' | 'listening';

export interface Passage {
  id: string;
  level: CefrLevel;
  title: string;
  text: string;
}

export interface Question {
  id: string;
  section: SectionId;
  level: CefrLevel;
  type: QuestionType;
  /** Sous-thème évalué (ex. « Verb tenses », « Travel vocabulary »). */
  tag: string;
  prompt: string;
  options: string[];
  /** Index de la bonne réponse dans `options`. */
  answer: number;
  /** Reading : référence vers le passage affiché. */
  passageId?: string;
  /** Listening : texte lu via la synthèse vocale (Web Speech API). */
  audioScript?: string;
  explanation?: string;
}

export type AnswerConfidence = 'sure' | 'unsure';

export interface AnsweredItem {
  questionId: string;
  section: SectionId;
  level: CefrLevel;
  correct: boolean;
  confidence?: AnswerConfidence;
}

export interface SectionResult {
  section: SectionId;
  asked: number;
  correct: number;
  /** Estimation d'aptitude finale de la section (1..6). */
  estimate: number;
  /** Score de compétence (0..100). */
  score: number;
  items: AnsweredItem[];
}

export type PlacementStatus = 'pending' | 'approved' | 'overridden';

export interface PlacementResult {
  id: string;
  studentId: string;
  studentName: string;
  language: string;

  /** Placement global proposé par le moteur. */
  level: CefrLevel;
  /** Confiance du placement (0..100). */
  confidence: number;
  /** Score par compétence (0..100). */
  skills: Record<SkillId, number>;
  sections: SectionResult[];

  strengths: string[];
  improvements: string[];
  recommendedClass: string;
  alternativeClass: string;
  learningFocus: string[];
  teacherInsight: string;

  completedAt: string;
  durationSec: number;

  /** Revue enseignant. */
  status: PlacementStatus;
  finalLevel?: CefrLevel;
  teacherComment?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

/** Activités recommandées selon la compétence la plus faible. */
export const FOCUS_BY_SKILL: Record<SkillId, string[]> = {
  listening:  ['Listening Practice'],
  usage:      ['Real-Life Communication', 'Speaking Activities'],
  grammar:    ['Grammar & Structure Drills'],
  vocabulary: ['Vocabulary Building'],
  reading:    ['Reading Comprehension Practice'],
};

export const STRENGTH_PHRASE: Record<SkillId, string> = {
  grammar:    'Good understanding of grammar rules',
  vocabulary: 'Strong vocabulary',
  reading:    'Good reading comprehension',
  listening:  'Sharp listening comprehension',
  usage:      'Confident real-world communication',
};

export const IMPROVEMENT_PHRASE: Record<SkillId, string> = {
  grammar:    'Advanced sentence structures',
  vocabulary: 'Broader vocabulary range',
  reading:    'Detailed reading comprehension',
  listening:  'Listening comprehension',
  usage:      'Practical communication',
};
