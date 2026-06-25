import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TeacherOpsService } from './teacher-ops.service';
import { ThemeService } from '@core/services/theme.service';
import { LANGUAGE_LEVELS, LanguageLevel } from '@shared/models/enrollment.model';
import {
  AiInsight, PERMISSIONS, STATUS_META, ScheduleSlot, TeacherOps, TeacherStatus,
} from './teacher-ops.model';

// Palette (les CSS vars ne sont pas lisibles par ECharts → canvas).
const PRIMARY = '#2563EB', SECONDARY = '#7C3AED', ACCENT = '#06B6D4', SUCCESS = '#22C55E', WARNING = '#F59E0B';

type StatusFilter = 'ALL' | TeacherStatus;

@Component({
  selector: 'app-teacher-ops',
  imports: [NgxEchartsDirective],
  templateUrl: './teacher-ops.component.html',
  styleUrl: './teacher-ops.component.css',
})
export class TeacherOpsComponent {

  readonly svc = inject(TeacherOpsService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly permissionDefs = PERMISSIONS;
  readonly statusMeta = STATUS_META;
  readonly cefrLevels = LANGUAGE_LEVELS;
  readonly weekDays: ScheduleSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // ── Filtres directory ──────────────────────────────────────────────────────
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly langFilter = signal<string>('ALL');
  readonly selectedId = signal<string | null>(null);

  // Surcharges éditables (frontend-only, persistées en session).
  private readonly permState = signal<Record<string, Record<string, boolean>>>({});
  private readonly noteState = signal<Record<string, string>>({});

  readonly statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'ACTIVE', label: '🟢 Active' },
    { value: 'ON_LEAVE', label: '🟡 On Leave' },
    { value: 'INACTIVE', label: '🔴 Inactive' },
  ];

  /** Langues disponibles pour le filtre (toutes celles couvertes). */
  readonly languages = computed(() => {
    const set = new Set<string>();
    this.svc.teachers().forEach(t => t.languages.forEach(l => set.add(l)));
    return [...set].sort();
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const st = this.statusFilter();
    const lang = this.langFilter();
    return this.svc.teachers().filter(t =>
      (st === 'ALL' || t.status === st) &&
      (lang === 'ALL' || t.languages.includes(lang)) &&
      (!q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) ||
        t.languages.some(l => l.toLowerCase().includes(q))));
  });

  /** Enseignant sélectionné (premier de la liste par défaut). */
  readonly selected = computed<TeacherOps | null>(() => {
    const list = this.svc.teachers();
    if (list.length === 0) return null;
    const id = this.selectedId();
    return list.find(t => t.id === id) ?? list[0];
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  select(t: TeacherOps): void {
    this.selectedId.set(t.id);
    // init des surcharges éditables si absentes
    if (!this.permState()[t.id]) this.permState.update(s => ({ ...s, [t.id]: { ...t.permissions } }));
    if (this.noteState()[t.id] === undefined) this.noteState.update(s => ({ ...s, [t.id]: t.notes }));
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }
  setStatus(s: StatusFilter): void { this.statusFilter.set(s); }
  setLang(l: string): void { this.langFilter.set(l); }

  addTeacher(): void { this.router.navigate(['/admin/users']); }

  /** Export CSV de l'annuaire (frontend-only). */
  exportReport(): void {
    const head = ['Teacher', 'Email', 'Languages', 'Levels', 'Students', 'Hours', 'Attendance', 'Success', 'Status'];
    const rows = this.svc.teachers().map(t => [
      t.name, t.email, t.languages.join(' | '), t.levels.join(' '),
      t.assignedStudents, t.teachingHours, `${t.attendanceRate}%`, `${t.successRate}%`, this.statusMeta[t.status].label,
    ]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'teacher-operations-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Permissions & notes (éditables) ─────────────────────────────────────────
  permissionsOf(t: TeacherOps): Record<string, boolean> {
    return this.permState()[t.id] ?? t.permissions;
  }
  togglePermission(t: TeacherOps, key: string): void {
    const cur = this.permissionsOf(t);
    this.permState.update(s => ({ ...s, [t.id]: { ...cur, [key]: !cur[key] } }));
  }
  noteOf(t: TeacherOps): string { return this.noteState()[t.id] ?? t.notes; }
  updateNote(t: TeacherOps, value: string): void {
    this.noteState.update(s => ({ ...s, [t.id]: value }));
  }

  // ── Assignment helpers (Section 3) ──────────────────────────────────────────
  hasLanguage(t: TeacherOps, lang: string): boolean { return t.languages.includes(lang); }
  hasLevel(t: TeacherOps, lvl: LanguageLevel): boolean { return t.levels.includes(lvl); }
  goToAssignments(): void { this.router.navigate(['/admin/languages']); }

  scheduleFor(t: TeacherOps, day: ScheduleSlot['day']): ScheduleSlot[] {
    return t.schedule.filter(s => s.day === day);
  }

  capacityClass(u: number): string { return u >= 90 ? 'danger' : u >= 75 ? 'warn' : 'ok'; }

  // ── AI demo (Section 9) ──────────────────────────────────────────────────────
  aiInsights(t: TeacherOps): AiInsight[] {
    return [
      { tone: 'good', icon: 'check_circle', text: `Students under ${t.name.split(' ')[0]} achieve excellent grammar results (top 15% of the school).` },
      { tone: 'warn', icon: 'hearing', text: 'Listening performance is below average across assigned groups.' },
      { tone: 'reco', icon: 'auto_awesome', text: 'Recommendation: increase listening exercises by 20% and add 2 conversation sessions / week.' },
    ];
  }

  // ── ECharts — KPI sparklines (Section 1) ─────────────────────────────────────
  readonly kpiCharts = computed(() => this.svc.kpis().map(k => this.sparkOption(k.spark, k.color)));

  // ── ECharts — Performance (Section 4) ────────────────────────────────────────
  readonly progressOpt = computed(() => {
    const t = this.selected(); void this.theme.isDark();
    return t ? this.areaOption(t.trendMonths, t.progressTrend, PRIMARY, 'Avg score', 100) : null;
  });
  readonly attendanceOpt = computed(() => {
    const t = this.selected(); void this.theme.isDark();
    return t ? this.areaOption(t.trendMonths, t.attendanceTrend, ACCENT, 'Attendance', 100) : null;
  });
  readonly examOpt = computed(() => {
    const t = this.selected(); void this.theme.isDark();
    return t ? this.barOption(t.trendMonths, t.examSuccessTrend, SECONDARY, 100) : null;
  });
  readonly hoursOpt = computed(() => {
    const t = this.selected(); void this.theme.isDark();
    return t ? this.barOption(t.trendMonths, t.hoursTrend, WARNING) : null;
  });

  private axisColor() { return this.theme.isDark() ? '#94A3B8' : '#64748B'; }
  private splitColor() { return this.theme.isDark() ? '#334155' : '#E2E8F0'; }
  private surfaceColor() { return this.theme.isDark() ? '#1E293B' : '#FFFFFF'; }

  private baseAxes(categories: string[], max?: number) {
    return {
      grid: { left: 4, right: 14, top: 18, bottom: 4, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category', data: categories, boundaryGap: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: this.splitColor() } },
        axisLabel: { color: this.axisColor() },
      },
      yAxis: {
        type: 'value', max,
        splitLine: { lineStyle: { color: this.splitColor() } },
        axisLabel: { color: this.axisColor() },
      },
    };
  }

  private areaOption(cats: string[], data: number[], color: string, name: string, max?: number): Record<string, unknown> {
    return {
      ...this.baseAxes(cats, max),
      series: [{
        name, type: 'line', smooth: true, showSymbol: true, symbol: 'circle', symbolSize: 7, data,
        lineStyle: { width: 3, color },
        itemStyle: { color, borderColor: this.surfaceColor(), borderWidth: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: rgba(color, 0.32) }, { offset: 1, color: rgba(color, 0.02) }] },
        },
      }],
    };
  }

  private barOption(cats: string[], data: number[], color: string, max?: number): Record<string, unknown> {
    return {
      ...this.baseAxes(cats, max),
      series: [{
        type: 'bar', data, barWidth: '46%',
        itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color }, { offset: 1, color: rgba(color, 0.5) }] } },
      }],
    };
  }

  private sparkOption(data: number[], color: string): Record<string, unknown> {
    return {
      grid: { left: 0, right: 0, top: 4, bottom: 0 },
      xAxis: { type: 'category', show: false, boundaryGap: false, data: data.map((_, i) => i) },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: { show: false },
      series: [{
        type: 'line', data, smooth: true, showSymbol: false,
        lineStyle: { width: 2.5, color },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: rgba(color, 0.35) }, { offset: 1, color: rgba(color, 0) }] } },
      }],
    };
  }
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}, ${alpha})`;
}
