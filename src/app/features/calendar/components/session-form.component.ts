import { Component, OnInit, inject, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToastService } from '@core/services/toast.service';
import { CalendarService } from '../services/calendar.service';
import {
  MeetingProvider, SessionInput, SessionStatus, SessionType, WEEKDAYS,
  minutesOf, pad2, parseISODate, toISODate,
} from '../models/calendar.model';

interface FormModel {
  title: string;
  language: string;
  level: string;
  teacherId: string;
  date: string;
  start: string;
  end: string;
  type: SessionType;
  location: string;
  meetingProvider: MeetingProvider;
  meetingLink: string;
  description: string;
  maxStudents: number;
  status: SessionStatus;
  recurrence: { enabled: boolean; days: number[]; weeks: number };
}

/** Modale de création / édition d'une session (enseignant / admin). */
@Component({
  selector: 'app-session-form',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './session-form.component.html',
  styleUrl: './session-form.component.css',
})
export class SessionFormComponent implements OnInit {

  readonly editId = input<string | null>(null);
  readonly canPickTeacher = input(false);
  readonly defaultTeacher = input<{ id: string; name: string } | null>(null);
  readonly defaultDate = input<string>('');

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly cal = inject(CalendarService);
  private readonly toast = inject(ToastService);

  readonly languages = ['English', 'French', 'Arabic', 'Spanish', 'German', 'Italian'];
  readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  readonly types: SessionType[] = ['online', 'hybrid', 'in-person'];
  readonly providers: MeetingProvider[] = ['meet', 'zoom', 'teams'];
  readonly statuses: SessionStatus[] = ['scheduled', 'completed', 'cancelled'];
  readonly teachers = this.cal.teachers;
  readonly weekdays = WEEKDAYS;

  form: FormModel = this.blank();

  ngOnInit(): void {
    const id = this.editId();
    if (id) {
      const s = this.cal.byId(id);
      if (s) {
        this.form = {
          title: s.title, language: s.language, level: s.level, teacherId: s.teacherId,
          date: s.date, start: s.start, end: s.end, type: s.type,
          location: s.location ?? '', meetingProvider: s.meetingProvider ?? 'meet',
          meetingLink: s.meetingLink ?? '', description: s.description ?? '',
          maxStudents: s.maxStudents ?? 12, status: s.status,
          recurrence: { enabled: false, days: [], weeks: 4 },
        };
        return;
      }
    }
    const def = this.defaultTeacher();
    // Default to a FUTURE slot so the new session is actually "upcoming". If the
    // user clicked a specific future day in the grid, keep that day at 10:00-12:00.
    const today = toISODate(new Date());
    const clicked = this.defaultDate();
    const useSlot = !clicked || clicked === today;
    const slot = this.futureSlot();
    this.form = {
      ...this.blank(),
      date: useSlot ? slot.date : clicked,
      start: useSlot ? slot.start : '10:00',
      end: useSlot ? slot.end : '12:00',
      teacherId: def?.id ?? this.teachers[0].id,
    };
  }

  get isEdit(): boolean { return !!this.editId(); }
  get showLink(): boolean { return this.form.type !== 'in-person'; }
  get showLocation(): boolean { return this.form.type !== 'online'; }

  toggleDay(d: number): void {
    const days = this.form.recurrence.days;
    this.form.recurrence.days = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
  }

  private teacherName(id: string): string {
    if (this.defaultTeacher()?.id === id) return this.defaultTeacher()!.name;
    return this.teachers.find((t) => t.id === id)?.name ?? 'Teacher';
  }

  save(): void {
    const f = this.form;
    if (!f.language || !f.level || !f.date || !f.start || !f.end) {
      this.toast.error('Please fill language, level, date and time.');
      return;
    }
    if (f.start >= f.end) { this.toast.error('End time must be after start time.'); return; }
    if (f.status === 'scheduled' && this.isPast(f.date, f.start)) {
      this.toast.error('This session is scheduled in the past. Pick a future date and time, or set its status to "Completed".');
      return;
    }

    const base: SessionInput = {
      title: f.title || `${f.language} ${f.level}`,
      language: f.language, level: f.level,
      teacherId: f.teacherId, teacherName: this.teacherName(f.teacherId),
      date: f.date, start: f.start, end: f.end, type: f.type,
      location: this.showLocation ? (f.location || undefined) : undefined,
      meetingProvider: this.showLink ? f.meetingProvider : undefined,
      meetingLink: this.showLink ? (f.meetingLink || undefined) : undefined,
      description: f.description || undefined,
      maxStudents: f.maxStudents || undefined,
      status: f.status,
    };

    const id = this.editId();
    if (id) {
      this.cal.update(id, base).subscribe({
        next: () => { this.toast.success('Session updated — students notified.'); this.finish(); },
        error: () => this.toast.error('Could not update the session.'),
      });
      return;
    }

    const recurrence = f.recurrence.enabled && f.recurrence.days.length
      ? { enabled: true, days: f.recurrence.days, weeks: f.recurrence.weeks }
      : undefined;
    this.cal.create(base, recurrence).subscribe({
      next: (created) => {
        this.toast.success(recurrence
          ? `${created.length} recurring sessions created — students notified.`
          : 'Session created — students notified.');
        this.finish();
      },
      error: () => this.toast.error('Could not create the session.'),
    });
  }

  private finish(): void {
    this.saved.emit();
    this.close.emit();
  }

  /** Next sensible future slot: the next full hour today, or 09:00 tomorrow if it's late. */
  private futureSlot(): { date: string; start: string; end: string } {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);            // round up to the next full hour
    if (d.getHours() >= 22) {                // too late today -> tomorrow morning
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    const startH = d.getHours();
    const endH = Math.min(startH + 2, 23);
    return { date: toISODate(d), start: `${pad2(startH)}:00`, end: `${pad2(endH)}:00` };
  }

  /** True if the given date + start time is already in the past. */
  private isPast(date: string, start: string): boolean {
    const d = parseISODate(date);
    d.setMinutes(minutesOf(start));
    return d.getTime() < Date.now();
  }

  private blank(): FormModel {
    return {
      title: '', language: 'English', level: 'B1', teacherId: '',
      date: '', start: '10:00', end: '12:00', type: 'in-person',
      location: 'Classroom A', meetingProvider: 'meet', meetingLink: '',
      description: '', maxStudents: 12, status: 'scheduled',
      recurrence: { enabled: false, days: [], weeks: 4 },
    };
  }
}
