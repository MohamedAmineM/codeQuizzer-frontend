import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CalendarView, Session, SESSION_TYPE_META, WEEKDAYS, langColor,
  addDays, minutesOf, parseISODate, sameDay, startOfMonth, startOfWeek, toISODate,
} from '../models/calendar.model';

const DAY_START = 8 * 60;   // 08:00
const DAY_END = 21 * 60;    // 21:00
const RANGE = DAY_END - DAY_START;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

interface PositionedEvent { s: Session; top: number; height: number; left: number; width: number; }
interface GridDay { date: Date; label: string; dayNum: number; isToday: boolean; events: PositionedEvent[]; nowPct: number | null; }
interface MonthDay { date: Date; dayNum: number; inMonth: boolean; isToday: boolean; events: Session[]; }
interface AgendaGroup { date: Date; iso: string; sessions: Session[]; }

/**
 * Calendrier multi-vues (jour / semaine / mois / agenda) — présentational.
 * Reçoit les sessions + la vue + la date d'ancrage, émet `open` au clic.
 */
@Component({
  selector: 'app-calendar-grid',
  imports: [DatePipe],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.css',
})
export class CalendarGridComponent {

  readonly sessions = input<Session[]>([]);
  readonly view = input<CalendarView>('week');
  readonly anchor = input<Date>(new Date());
  readonly open = output<Session>();

  readonly hours = HOURS;
  readonly typeMeta = SESSION_TYPE_META;
  readonly color = langColor;

  // ── Vue jour / semaine (time-grid) ─────────────────────────────────
  readonly timeGrid = computed<GridDay[]>(() => {
    const view = this.view();
    const count = view === 'day' ? 1 : 7;
    const first = view === 'day' ? new Date(this.anchor()) : startOfWeek(this.anchor());
    const today = new Date();
    const nowMin = today.getHours() * 60 + today.getMinutes();
    const days: GridDay[] = [];
    for (let i = 0; i < count; i++) {
      const date = addDays(first, i);
      const iso = toISODate(date);
      const isToday = sameDay(date, today);
      const dayEvents = this.sessions().filter((s) => s.date === iso);
      days.push({
        date, label: WEEKDAYS[date.getDay()], dayNum: date.getDate(), isToday,
        events: this.layoutDay(dayEvents),
        nowPct: isToday && nowMin >= DAY_START && nowMin <= DAY_END ? ((nowMin - DAY_START) / RANGE) * 100 : null,
      });
    }
    return days;
  });

  // ── Vue mois ────────────────────────────────────────────────────────
  readonly month = computed<MonthDay[][]>(() => {
    const anchor = this.anchor();
    const gridStart = startOfWeek(startOfMonth(anchor));
    const today = new Date();
    const weeks: MonthDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: MonthDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(gridStart, w * 7 + i);
        const iso = toISODate(date);
        row.push({
          date, dayNum: date.getDate(), inMonth: date.getMonth() === anchor.getMonth(),
          isToday: sameDay(date, today),
          events: this.sessions().filter((s) => s.date === iso).sort((a, b) => minutesOf(a.start) - minutesOf(b.start)),
        });
      }
      weeks.push(row);
    }
    return weeks;
  });

  readonly weekdayHeaders = WEEKDAYS.slice(1).concat(WEEKDAYS[0]); // Mon..Sun

  // ── Vue agenda ──────────────────────────────────────────────────────
  readonly agenda = computed<AgendaGroup[]>(() => {
    const map = new Map<string, Session[]>();
    const sorted = [...this.sessions()].sort(
      (a, b) => a.date.localeCompare(b.date) || minutesOf(a.start) - minutesOf(b.start));
    for (const s of sorted) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return [...map.entries()].map(([iso, sessions]) => ({ iso, date: parseISODate(iso), sessions }));
  });

  emit(s: Session): void { this.open.emit(s); }

  private layoutDay(events: Session[]): PositionedEvent[] {
    const sorted = [...events].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
    const colEnds: number[] = [];
    const placed = sorted.map((s) => {
      const start = minutesOf(s.start);
      const end = minutesOf(s.end);
      let col = colEnds.findIndex((e) => e <= start);
      if (col === -1) { col = colEnds.length; colEnds.push(end); } else { colEnds[col] = end; }
      return { s, start, end, col };
    });
    const cols = Math.max(1, colEnds.length);
    return placed.map((p) => {
      const top = Math.min(100, Math.max(0, ((p.start - DAY_START) / RANGE) * 100));
      const bottom = Math.min(100, Math.max(0, ((p.end - DAY_START) / RANGE) * 100));
      return {
        s: p.s, top, height: Math.max(3.5, bottom - top),
        left: p.col * (100 / cols), width: 100 / cols,
      };
    });
  }
}
