import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '@env/environment';
import { UserService } from '../services/user.service';
import { AdminUser } from '@shared/models/app-user.model';
import { CategoryInfo } from '@shared/models/quiz-question.model';
import { TeacherStudentRow } from '@shared/models/teacher.model';
import { LANGUAGE_LEVELS, LanguageLevel } from '@shared/models/enrollment.model';
import {
  DEFAULT_PERMISSIONS, KpiCard, ScheduleSlot, TeacherOps, TeacherStatus,
} from './teacher-ops.model';

const PALETTE = ['#2563EB', '#22C55E', '#06B6D4', '#7C3AED', '#F59E0B', '#0EA5E9'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const ROOMS = ['Classroom A', 'Classroom B', 'Classroom C', 'Online Session', 'Lab 1'];
const DAYS: ScheduleSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Teacher Operations Center — agrège des données RÉELLES (enseignants Keycloak,
 * catégories possédées, inscriptions étudiants par catégorie) et des métriques de
 * DÉMO déterministes (heures, présence, sessions, planning…) tant que le backend
 * ne les expose pas. Frontend-only pour l'instant.
 */
@Injectable({ providedIn: 'root' })
export class TeacherOpsService {

  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly api = `${environment.apiUrl}/api`;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly teachers = signal<TeacherOps[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      teachers: this.users.listTeachers(),
      categories: this.http.get<CategoryInfo[]>(`${this.api}/categories`),
      report: this.http.get<TeacherStudentRow[]>(`${this.api}/enrollments/admin/all`),
    }).subscribe({
      next: ({ teachers, categories, report }) => {
        this.teachers.set(this.derive(teachers, categories, report));
        this.loading.set(false);
      },
      error: () => { this.teachers.set([]); this.loading.set(false); this.error.set(true); },
    });
  }

  // ── KPIs (Section 1) ──────────────────────────────────────────────────────
  readonly kpis = computed<KpiCard[]>(() => {
    const t = this.teachers();
    if (t.length === 0) return [];
    const langs = new Set<string>();
    t.forEach(x => x.languages.forEach(l => langs.add(l)));
    const students = t.reduce((s, x) => s + x.assignedStudents, 0);
    const hours = t.reduce((s, x) => s + x.teachingHours, 0);
    const active = t.filter(x => x.status === 'ACTIVE').length;
    const successAvg = Math.round(t.reduce((s, x) => s + x.successRate, 0) / t.length);
    const agg = (sel: (x: TeacherOps) => number[]) =>
      MONTHS.map((_, i) => Math.round(t.reduce((s, x) => s + (sel(x)[i] ?? 0), 0) / t.length));
    return [
      { key: 'total',    icon: '👨‍🏫', label: 'Total Teachers',         value: `${t.length}`,        trend: 8,  color: PALETTE[0], spark: agg(x => x.hoursTrend).map(v => v / 10) },
      { key: 'active',   icon: '🟢',   label: 'Active Teachers',         value: `${active}`,          trend: 5,  color: PALETTE[1], spark: agg(x => x.attendanceTrend) },
      { key: 'langs',    icon: '📚',   label: 'Languages Covered',       value: `${langs.size}`,      trend: 12, color: PALETTE[2], spark: [3, 4, 4, 5, 5, langs.size] },
      { key: 'students', icon: '👨‍🎓', label: 'Assigned Students',       value: `${students}`,        trend: 14, color: PALETTE[3], spark: agg(x => x.progressTrend) },
      { key: 'success',  icon: '📈',   label: 'Avg Success Rate',        value: `${successAvg}%`,     trend: 4,  color: PALETTE[4], spark: agg(x => x.examSuccessTrend) },
      { key: 'hours',    icon: '⏱',    label: 'Teaching Hours / Month',  value: `${hours}h`,          trend: 9,  color: PALETTE[5], spark: agg(x => x.hoursTrend) },
    ];
  });

  // ── Leaderboard (Section 5) ────────────────────────────────────────────────
  readonly leaderboard = computed<TeacherOps[]>(() =>
    [...this.teachers()]
      .sort((a, b) => (b.successRate * 0.6 + b.attendanceRate * 0.4) - (a.successRate * 0.6 + a.attendanceRate * 0.4))
      .slice(0, 5));

  // ── Dérivation ──────────────────────────────────────────────────────────────
  private derive(teachers: AdminUser[], categories: CategoryInfo[], report: TeacherStudentRow[]): TeacherOps[] {
    const list = teachers.map(t => this.deriveOne(t, categories, report));
    return list
      .sort((a, b) => (b.successRate * 0.6 + b.attendanceRate * 0.4) - (a.successRate * 0.6 + a.attendanceRate * 0.4))
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }

  private deriveOne(t: AdminUser, categories: CategoryInfo[], report: TeacherStudentRow[]): TeacherOps {
    const rnd = mulberry32(hashSeed(t.id));
    const name = `${t.firstName} ${t.lastName}`.trim() || t.email;

    // ── RÉEL : langues possédées + inscriptions dans ces catégories ──
    const owned = categories.filter(c => c.teacherId === t.id);
    const ownedNames = new Set(owned.map(c => c.name as string));
    const rows = report.filter(r => ownedNames.has(r.categoryName));
    const hasReal = rows.length > 0;

    const realStudents = new Set(rows.map(r => r.studentName)).size;
    const realAvg = hasReal ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    const realSuccess = hasReal ? Math.round(100 * rows.filter(r => r.eligibleForPromotion).length / rows.length) : 0;
    const realLevels = [...new Set(rows.map(r => r.currentLevel))]
      .sort((a, b) => LANGUAGE_LEVELS.indexOf(a) - LANGUAGE_LEVELS.indexOf(b));

    // langues : possédées en réel, sinon 1–2 déterministes pour la démo
    let languages = [...ownedNames];
    if (languages.length === 0 && categories.length) {
      const pool = categories.map(c => c.name as string);
      const a = pool[Math.floor(rnd() * pool.length)];
      const b = pool[Math.floor(rnd() * pool.length)];
      languages = [...new Set([a, b])];
    }

    // ── DÉMO déterministe ──
    const capacity = 60;
    const assignedStudents = hasReal ? Math.min(realStudents, capacity) : 18 + Math.floor(rnd() * 34);
    const utilization = Math.round((assignedStudents / capacity) * 100);
    const attendanceRate = 85 + Math.floor(rnd() * 14);
    const successRate = hasReal ? realSuccess : 74 + Math.floor(rnd() * 22);
    const avgScore = hasReal ? realAvg : 70 + Math.floor(rnd() * 24);
    const teachingHours = 64 + Math.floor(rnd() * 88);
    const sessions = 12 + Math.floor(rnd() * 28);
    const certificates = Math.floor(rnd() * 24);
    const studentsPromoted = Math.round(assignedStudents * (successRate / 100) * (0.4 + rnd() * 0.4));

    const levels: LanguageLevel[] = realLevels.length ? realLevels
      : (['A1', 'A2', 'B1', 'B2'] as LanguageLevel[]).slice(0, 2 + Math.floor(rnd() * 3));

    const status = pickStatus(rnd);

    const trend = (base: number, spread: number) =>
      MONTHS.map(() => clamp(Math.round(base + (rnd() - 0.5) * spread), 0, 100));

    return {
      id: t.id, name, email: t.email, initials: initials(name), status,
      languages, levels, assignedStudents, capacity, utilization,
      teachingHours, availableSlots: 2 + Math.floor(rnd() * 8),
      attendanceRate, successRate, avgScore, certificates, sessions, studentsPromoted,
      rank: 0, trendMonths: MONTHS,
      progressTrend: trend(avgScore, 16),
      attendanceTrend: trend(attendanceRate, 8),
      examSuccessTrend: trend(successRate, 18),
      hoursTrend: MONTHS.map(() => 40 + Math.floor(rnd() * 80)),
      schedule: buildSchedule(rnd, languages, levels),
      permissions: { ...DEFAULT_PERMISSIONS },
      notes: '',
      realData: hasReal,
    };
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

function pickStatus(rnd: () => number): TeacherStatus {
  const r = rnd();
  if (r > 0.88) return 'INACTIVE';
  if (r > 0.74) return 'ON_LEAVE';
  return 'ACTIVE';
}

function buildSchedule(rnd: () => number, languages: string[], levels: LanguageLevel[]): ScheduleSlot[] {
  const lang = () => languages[Math.floor(rnd() * languages.length)] ?? 'English';
  const lvl = () => levels[Math.floor(rnd() * levels.length)] ?? 'A1';
  const starts = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const count = 3 + Math.floor(rnd() * 3);
  const slots: ScheduleSlot[] = [];
  const usedDays = new Set<string>();
  for (let i = 0; i < count; i++) {
    let day = DAYS[Math.floor(rnd() * DAYS.length)];
    let guard = 0;
    while (usedDays.has(day) && guard++ < 5) day = DAYS[Math.floor(rnd() * DAYS.length)];
    usedDays.add(day);
    const start = starts[Math.floor(rnd() * starts.length)];
    const end = `${(parseInt(start) + 2).toString().padStart(2, '0')}:00`;
    const room = ROOMS[Math.floor(rnd() * ROOMS.length)];
    slots.push({ day, start, end, language: lang(), level: lvl(), location: room, online: room === 'Online Session' });
  }
  const order = (d: ScheduleSlot['day']) => DAYS.indexOf(d);
  return slots.sort((a, b) => order(a.day) - order(b.day) || a.start.localeCompare(b.start));
}

/** Graine déterministe à partir d'une chaîne (id) → métriques stables entre rendus. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
