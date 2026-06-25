import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ToastService } from '@core/services/toast.service';
import { CalendarService } from '../services/calendar.service';
import {
  ATTENDANCE_META, AttendanceEntry, AttendanceStatus, PROVIDER_LABEL, SESSION_TYPE_META, STATUS_META,
  durationLabel, langColor, parseISODate,
} from '../models/calendar.model';

const ATTENDANCE_ORDER: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

/**
 * Modale de détail d'une session. Lecture pour tous ; bouton « Join » si en
 * ligne ; gestion de présence + actions (éditer / annuler / supprimer) selon
 * les permissions. Lit la session depuis le store (by id) pour refléter les
 * marquages de présence en direct.
 */
@Component({
  selector: 'app-session-detail',
  imports: [DatePipe],
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.css',
})
export class SessionDetailComponent {

  readonly sessionId = input.required<string>();
  readonly canManage = input(false);
  readonly canDelete = input(false);

  readonly close = output<void>();
  readonly edit = output<string>();

  private readonly cal = inject(CalendarService);
  private readonly toast = inject(ToastService);

  readonly attendanceMeta = ATTENDANCE_META;
  readonly attendanceOrder = ATTENDANCE_ORDER;
  readonly typeMeta = SESSION_TYPE_META;
  readonly statusMeta = STATUS_META;
  readonly providerLabel = PROVIDER_LABEL;
  readonly color = langColor;

  readonly session = computed(() => this.cal.byId(this.sessionId()));
  readonly date = computed(() => { const s = this.session(); return s ? parseISODate(s.date) : null; });
  readonly duration = computed(() => { const s = this.session(); return s ? durationLabel(s.start, s.end) : ''; });
  // ── Présence : brouillon local (overrides) + enregistrement en lot ──────────
  /** Surcharges non enregistrées : studentId → statut (null = non marqué). */
  readonly draft = signal<Record<string, AttendanceStatus | null>>({});
  readonly saving = signal(false);
  readonly search = signal('');
  readonly unmarkedOnly = signal(false);

  readonly roster = computed<AttendanceEntry[]>(() => this.session()?.attendance ?? []);

  /** Statut effectif (override du brouillon sinon valeur serveur). */
  current(a: AttendanceEntry): AttendanceStatus | null {
    const d = this.draft();
    return a.studentId in d ? d[a.studentId] : a.status;
  }

  readonly filteredRoster = computed<AttendanceEntry[]>(() => {
    const q = this.search().trim().toLowerCase();
    const unmarked = this.unmarkedOnly();
    return this.roster().filter((a) =>
      (!q || a.studentName.toLowerCase().includes(q)) &&
      (!unmarked || this.current(a) === null));
  });

  readonly summary = computed(() => {
    let present = 0, late = 0, absent = 0, excused = 0, marked = 0;
    for (const a of this.roster()) {
      const s = this.current(a);
      if (s) marked++;
      if (s === 'present') present++;
      else if (s === 'late') late++;
      else if (s === 'absent') absent++;
      else if (s === 'excused') excused++;
    }
    const total = this.roster().length;
    return { present, late, absent, excused, marked, total, pct: total ? Math.round((marked / total) * 100) : 0 };
  });

  /** Des modifications sont-elles en attente d'enregistrement ? */
  readonly dirty = computed(() => {
    const d = this.draft();
    return this.roster().some((a) => a.studentId in d && d[a.studentId] !== a.status);
  });

  /** Tap sur un statut : applique, ou ré-appui = retire le marquage. */
  set(a: AttendanceEntry, status: AttendanceStatus): void {
    const next = this.current(a) === status ? null : status;
    this.draft.update((d) => ({ ...d, [a.studentId]: next }));
  }

  private setAll(status: AttendanceStatus | null): void {
    this.draft.update((d) => {
      const n = { ...d };
      for (const a of this.roster()) n[a.studentId] = status;
      return n;
    });
  }
  allPresent(): void { this.setAll('present'); }
  allAbsent(): void { this.setAll('absent'); }
  clearAll(): void { this.setAll(null); }

  /** Marque « présent » uniquement les étudiants encore non marqués. */
  fillRemaining(): void {
    this.draft.update((d) => {
      const n = { ...d };
      for (const a of this.roster()) {
        const cur = a.studentId in n ? n[a.studentId] : a.status;
        if (cur == null) n[a.studentId] = 'present';
      }
      return n;
    });
  }

  discard(): void { this.draft.set({}); }

  saveAttendance(): void {
    const s = this.session();
    if (!s || !this.dirty()) return;
    const entries = this.roster().map((a) => ({ studentId: a.studentId, status: this.current(a) }));
    this.saving.set(true);
    this.cal.setAttendanceBulk(s.id, entries).subscribe({
      next: () => { this.saving.set(false); this.draft.set({}); this.toast.success('Attendance saved.'); },
      error: () => { this.saving.set(false); this.toast.error('Could not save attendance.'); },
    });
  }

  cancelSession(): void {
    const s = this.session();
    if (!s) return;
    this.cal.cancel(s.id).subscribe({
      next: () => this.toast.info('Session cancelled — students and teacher notified.'),
      error: () => this.toast.error('Could not cancel the session.'),
    });
  }

  deleteSession(): void {
    const s = this.session();
    if (!s) return;
    this.cal.remove(s.id).subscribe({
      next: () => { this.toast.success('Session deleted.'); this.close.emit(); },
      error: () => this.toast.error('Could not delete the session.'),
    });
  }

  editSession(): void {
    const s = this.session();
    if (s) this.edit.emit(s.id);
  }
}
