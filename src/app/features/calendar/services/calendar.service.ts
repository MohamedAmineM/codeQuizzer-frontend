import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

import {
  AttendanceStatus, RecurrenceRule, Session, SessionInput, minutesOf, parseISODate,
} from '../models/calendar.model';

interface TeacherRef { id: string; name: string; }

/** Enseignants proposés à l'admin pour assigner une séance (pré-remplissage UI). */
const TEACHERS: TeacherRef[] = [
  { id: 't-tom', name: 'Tom Smith' },
  { id: 't-sara', name: 'Sara Lopez' },
  { id: 't-amine', name: 'Amine Haddad' },
];

/**
 * Calendrier — branché sur le QUIZ SERVICE via le gateway :
 *   GET    {apiUrl}/api/sessions                      (liste adaptée au rôle)
 *   POST   {apiUrl}/api/sessions                      (création + récurrence)
 *   PUT    {apiUrl}/api/sessions/{id}                 (mise à jour)
 *   PUT    {apiUrl}/api/sessions/{id}/cancel
 *   DELETE {apiUrl}/api/sessions/{id}
 *   PUT    {apiUrl}/api/sessions/{id}/attendance/{studentId}
 *
 * La visibilité étudiant (couples langue/niveau) est résolue côté backend ;
 * la création publie un événement RabbitMQ → notification des étudiants inscrits.
 */
@Injectable({ providedIn: 'root' })
export class CalendarService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/sessions`;

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(false);
  readonly teachers = TEACHERS;

  /** Recharge la liste (déjà filtrée par rôle côté serveur). */
  load(): void {
    this.loading.set(true);
    this.http.get<Session[]>(this.baseUrl).subscribe({
      next: (list) => { this.sessions.set(list ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  byId(id: string): Session | undefined {
    return this.sessions().find((s) => s.id === id);
  }

  /** Prochaines séances (à partir de maintenant), triées, limitées. */
  upcoming(pool: Session[], limit = 5): Session[] {
    const now = Date.now();
    return pool
      .filter((s) => s.status !== 'cancelled' && this.startMs(s) >= now - 60 * 60 * 1000)
      .sort((a, b) => this.startMs(a) - this.startMs(b))
      .slice(0, limit);
  }

  // ── Écriture (HTTP puis rechargement du signal) ─────────────────────
  create(input: SessionInput, recurrence?: RecurrenceRule): Observable<Session[]> {
    const body = recurrence ? { ...input, recurrence } : input;
    return this.http.post<Session[]>(this.baseUrl, body).pipe(tap(() => this.load()));
  }

  update(id: string, input: SessionInput): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/${id}`, input).pipe(tap(() => this.load()));
  }

  cancel(id: string): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/${id}/cancel`, {}).pipe(tap(() => this.load()));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.load()));
  }

  setAttendance(id: string, studentId: string, status: AttendanceStatus): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/${id}/attendance/${studentId}`, { status })
      .pipe(tap(() => this.load()));
  }

  /** Marquage de présence en lot — un seul aller-retour pour toute la classe. */
  setAttendanceBulk(id: string, entries: { studentId: string; status: AttendanceStatus | null }[]): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/${id}/attendance`, { entries })
      .pipe(tap(() => this.load()));
  }

  // ── Export ICS (sync-ready : Google / Outlook) ─────────────────────
  toICS(sessions: Session[]): string {
    const dt = (date: string, time: string) =>
      `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
    const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CodeQuizzer//Calendar//EN', 'CALSCALE:GREGORIAN'];
    for (const s of sessions) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${s.id}@codequizzer`,
        `DTSTART:${dt(s.date, s.start)}`,
        `DTEND:${dt(s.date, s.end)}`,
        `SUMMARY:${esc(s.title || `${s.language} ${s.level}`)}`,
        `LOCATION:${esc(s.meetingLink || s.location || '')}`,
        `DESCRIPTION:${esc(`${s.language} ${s.level} · ${s.teacherName}${s.description ? ' · ' + s.description : ''}`)}`,
        `STATUS:${s.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private startMs(s: Session): number {
    const d = parseISODate(s.date);
    d.setMinutes(minutesOf(s.start));
    return d.getTime();
  }
}
