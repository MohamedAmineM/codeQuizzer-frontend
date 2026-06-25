import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CalendarService } from '../services/calendar.service';
import {
  SESSION_TYPE_META, Session, durationLabel, langColor, parseISODate, sameDay,
} from '../models/calendar.model';

interface UpcomingItem { s: Session; dayLabel: string; }

/** Widget « Upcoming Classes » embarquable dans les dashboards (rôle-aware). */
@Component({
  selector: 'app-upcoming-widget',
  imports: [RouterLink],
  template: `
    <div class="card uw">
      <div class="uw-head">
        <span class="card-title"><span class="material-icons">event_upcoming</span> Upcoming Classes</span>
        <a class="uw-all" routerLink="/calendar">Open calendar <span class="material-icons">arrow_forward</span></a>
      </div>

      @if (items().length === 0) {
        <div class="uw-empty"><span class="material-icons">event_available</span> No upcoming sessions</div>
      } @else {
        <div class="uw-list">
          @for (it of items(); track it.s.id) {
            <a class="uw-item" routerLink="/calendar" [style.border-left-color]="color(it.s.language)">
              <span class="uw-when">
                <span class="uw-day">{{ it.dayLabel }}</span>
                <span class="uw-time">{{ it.s.start }} – {{ it.s.end }}</span>
              </span>
              <span class="uw-main">
                <span class="uw-name">{{ it.s.language }} {{ it.s.level }}</span>
                <span class="uw-sub">{{ it.s.teacherName }} · {{ typeMeta[it.s.type].label }}</span>
              </span>
              @if (it.s.type !== 'in-person' && it.s.meetingLink) {
                <span class="uw-join"><span class="material-icons">videocam</span></span>
              } @else {
                <span class="uw-dur">{{ dur(it.s) }}</span>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .uw-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
    .card-title { margin: 0; }
    .uw-all { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: var(--primary); }
    .uw-all .material-icons { font-size: 16px; }
    .uw-list { display: flex; flex-direction: column; gap: 8px; }
    .uw-item {
      display: grid; grid-template-columns: 92px 1fr auto; align-items: center; gap: 12px;
      padding: 11px 14px; background: var(--bg); border: 1px solid var(--border);
      border-left: 4px solid var(--primary); border-radius: var(--radius-md);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .uw-item:hover { transform: translateX(2px); box-shadow: var(--shadow-sm); }
    .uw-when { display: flex; flex-direction: column; }
    .uw-day { font-size: 12px; font-weight: 800; color: var(--primary); }
    .uw-time { font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .uw-main { display: flex; flex-direction: column; min-width: 0; }
    .uw-name { font-size: 14px; font-weight: 700; }
    .uw-sub { font-size: 12.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .uw-dur { font-size: 12px; font-weight: 700; color: var(--text-light); }
    .uw-join { width: 32px; height: 32px; border-radius: 50%; background: var(--gradient-brand); color: #fff; display: flex; align-items: center; justify-content: center; }
    .uw-join .material-icons { font-size: 17px; }
    .uw-empty { display: flex; align-items: center; gap: 8px; padding: var(--space-5); justify-content: center; color: var(--text-muted); font-size: 14px; }
    .uw-empty .material-icons { font-size: 20px; color: var(--text-light); }
  `],
})
export class UpcomingWidgetComponent {

  readonly limit = input(4);

  private readonly cal = inject(CalendarService);

  readonly typeMeta = SESSION_TYPE_META;
  readonly color = langColor;

  constructor() { this.cal.load(); }

  /** Le backend renvoie déjà les séances visibles par l'utilisateur courant. */
  readonly items = computed<UpcomingItem[]>(() =>
    this.cal.upcoming(this.cal.sessions(), this.limit()).map((s) => ({ s, dayLabel: this.dayLabel(s.date) })));

  dur(s: Session): string { return durationLabel(s.start, s.end); }

  private dayLabel(iso: string): string {
    const d = parseISODate(iso);
    const today = new Date();
    if (sameDay(d, today)) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (sameDay(d, tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  }
}
