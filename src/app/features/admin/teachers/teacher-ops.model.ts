import { LanguageLevel } from '@shared/models/enrollment.model';

/** Statut opérationnel d'un enseignant (dérivé — pas encore porté par le backend). */
export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export interface ScheduleSlot {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  start: string;          // "10:00"
  end: string;            // "12:00"
  language: string;
  level: LanguageLevel;
  location: string;       // "Classroom A" | "Online Session"
  online: boolean;
}

/**
 * Vue « operations » d'un enseignant. Les champs marqués (demo) sont dérivés de
 * façon déterministe à partir de l'id (graine stable) tant que le backend
 * n'expose pas ces métriques — même approche que le rapport d'activité
 * (noms réels + lignes de base premium simulées).
 */
export interface TeacherOps {
  id: string;                 // keycloak sub
  name: string;
  email: string;
  initials: string;
  status: TeacherStatus;      // (demo)
  languages: string[];        // RÉEL : catégories possédées (category.teacher_id)
  levels: LanguageLevel[];    // RÉEL si étudiants, sinon (demo)
  assignedStudents: number;   // RÉEL si inscriptions, sinon (demo)
  capacity: number;           // (demo)
  utilization: number;        // % (demo)
  teachingHours: number;      // ce mois (demo)
  availableSlots: number;     // (demo)
  attendanceRate: number;     // % (demo)
  successRate: number;        // % RÉEL si inscriptions, sinon (demo)
  avgScore: number;           // % RÉEL si inscriptions, sinon (demo)
  certificates: number;       // (demo)
  sessions: number;           // ce mois (demo)
  studentsPromoted: number;   // (demo)
  rank: number;               // calculé (leaderboard)
  trendMonths: string[];
  progressTrend: number[];    // (demo)
  attendanceTrend: number[];  // (demo)
  examSuccessTrend: number[]; // (demo)
  hoursTrend: number[];       // (demo)
  schedule: ScheduleSlot[];   // (demo)
  permissions: Record<string, boolean>;
  notes: string;
  realData: boolean;          // true si students/score viennent de vraies inscriptions
}

export interface KpiCard {
  key: string;
  icon: string;
  label: string;
  value: string;
  trend: number;              // % vs mois précédent
  spark: number[];
  color: string;
}

export const PERMISSIONS: { key: string; label: string; icon: string }[] = [
  { key: 'viewStudents',     label: 'View Students',     icon: 'group' },
  { key: 'manageAttendance', label: 'Manage Attendance', icon: 'event_available' },
  { key: 'createAssessments',label: 'Create Assessments',icon: 'quiz' },
  { key: 'gradeExams',       label: 'Grade Exams',       icon: 'grading' },
  { key: 'uploadResources',  label: 'Upload Resources',  icon: 'upload_file' },
  { key: 'viewReports',      label: 'View Reports',      icon: 'assessment' },
  { key: 'manageCalendar',   label: 'Manage Calendar',   icon: 'calendar_month' },
  { key: 'manageUsers',      label: 'Manage Users',      icon: 'manage_accounts' },
  { key: 'schoolSettings',   label: 'School Settings',   icon: 'settings' },
];

export const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  viewStudents: true, manageAttendance: true, createAssessments: true, gradeExams: true,
  uploadResources: true, viewReports: true, manageCalendar: true, manageUsers: false, schoolSettings: false,
};

export const STATUS_META: Record<TeacherStatus, { label: string; dot: string; cls: string }> = {
  ACTIVE:   { label: 'Active',   dot: '🟢', cls: 'ok' },
  ON_LEAVE: { label: 'On Leave', dot: '🟡', cls: 'warn' },
  INACTIVE: { label: 'Inactive', dot: '🔴', cls: 'danger' },
};

/** AI demo (placeholder Section 9) — remplacé plus tard par un vrai service d'insights. */
export interface AiInsight { tone: 'good' | 'warn' | 'reco'; icon: string; text: string; }
