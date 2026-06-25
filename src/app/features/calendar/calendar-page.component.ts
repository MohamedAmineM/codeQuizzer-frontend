import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { CalendarService } from './services/calendar.service';
import { CalendarGridComponent } from './components/calendar-grid.component';
import { SessionDetailComponent } from './components/session-detail.component';
import { SessionFormComponent } from './components/session-form.component';
import {
  CalendarFilters, CalendarView, Session, SessionType, addDays, startOfWeek, toISODate,
} from './models/calendar.model';

/**
 * Page Calendrier — une seule page, expérience différenciée par rôle :
 *  - Étudiant  : lecture seule, ses sessions (langue+niveau), pas d'actions.
 *  - Enseignant: gère les sessions, prend les présences.
 *  - Admin     : vue globale + filtres + suppression + assignation enseignant.
 */
@Component({
  selector: 'app-calendar-page',
  imports: [FormsModule, CalendarGridComponent, SessionDetailComponent, SessionFormComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css',
})
export class CalendarPageComponent {

  readonly auth = inject(AuthService);
  private readonly cal = inject(CalendarService);
  private readonly toast = inject(ToastService);

  readonly view = signal<CalendarView>('week');
  readonly anchor = signal<Date>(new Date());
  readonly detailId = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly formEditId = signal<string | null>(null);

  readonly filters = signal<CalendarFilters>({ teacherId: '', language: '', level: '', type: '' });

  readonly languages = ['English', 'French', 'Arabic', 'Spanish', 'German', 'Italian'];
  readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  readonly typeOptions: SessionType[] = ['online', 'hybrid', 'in-person'];
  readonly teachers = this.cal.teachers;

  // ── Permissions ────────────────────────────────────────────────────
  readonly canManage = computed(() => this.auth.isTeacher() || this.auth.isAdmin());
  readonly canDelete = computed(() => this.auth.isAdmin());
  readonly canPickTeacher = computed(() => this.auth.isAdmin());
  readonly isStudentOnly = computed(() => this.auth.isStudent() && !this.auth.isTeacher() && !this.auth.isAdmin());
  readonly views = computed<CalendarView[]>(() =>
    this.isStudentOnly() ? ['day', 'week', 'month'] : ['day', 'week', 'month', 'agenda']);

  readonly myTeacherRef = computed(() => ({
    id: this.auth.user()?.id ?? 'me', name: this.auth.fullName() || 'Teacher',
  }));

  constructor() { this.cal.load(); }

  // ── Pool visible (déjà filtré par rôle côté backend) ────────────────
  readonly visible = computed<Session[]>(() => {
    const list = this.cal.sessions();
    return this.auth.isAdmin() ? this.applyFilters(list) : list;
  });

  readonly periodLabel = computed(() => {
    const v = this.view();
    const a = this.anchor();
    if (v === 'month') return a.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (v === 'day') return a.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const s = startOfWeek(a);
    const e = addDays(s, 6);
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opt)} – ${e.toLocaleDateString('en-US', { ...opt, year: 'numeric' })}`;
  });

  // ── Navigation ──────────────────────────────────────────────────────
  setView(v: CalendarView): void { this.view.set(v); }
  today(): void { this.anchor.set(new Date()); }
  shift(dir: number): void {
    const a = new Date(this.anchor());
    const v = this.view();
    if (v === 'month') a.setMonth(a.getMonth() + dir);
    else if (v === 'day') a.setDate(a.getDate() + dir);
    else a.setDate(a.getDate() + dir * 7);
    this.anchor.set(a);
  }

  // ── Modales ─────────────────────────────────────────────────────────
  openDetail(s: Session): void { this.detailId.set(s.id); }
  closeDetail(): void { this.detailId.set(null); }
  openNew(): void { this.formEditId.set(null); this.formOpen.set(true); }
  openEdit(id: string): void { this.detailId.set(null); this.formEditId.set(id); this.formOpen.set(true); }
  closeForm(): void { this.formOpen.set(false); }

  // ── Export ICS ──────────────────────────────────────────────────────
  exportICS(): void {
    const ics = this.cal.toICS(this.visible());
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codequizzer-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Calendar exported (.ics) — ready for Google / Outlook.');
  }

  resetFilters(): void { this.filters.set({ teacherId: '', language: '', level: '', type: '' }); }

  patchFilter<K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  private applyFilters(list: Session[]): Session[] {
    const f = this.filters();
    return list.filter((s) =>
      (!f.teacherId || s.teacherId === f.teacherId) &&
      (!f.language || s.language === f.language) &&
      (!f.level || s.level === f.level) &&
      (!f.type || s.type === f.type));
  }

  protected readonly toISODate = toISODate;
}
