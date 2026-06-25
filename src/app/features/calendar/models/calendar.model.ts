/**
 * Modèle du module « Academic Calendar & Session Management ».
 * v1 frontend : persistance locale, API « HTTP-ready » (voir CalendarService).
 */

export type SessionType = 'online' | 'hybrid' | 'in-person';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type CalendarView = 'day' | 'week' | 'month' | 'agenda';
export type MeetingProvider = 'meet' | 'zoom' | 'teams';

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
}

export interface Session {
  id: string;
  title: string;
  language: string;          // ex. 'English'
  level: string;             // ex. 'B1'
  teacherId: string;
  teacherName: string;
  date: string;              // 'YYYY-MM-DD'
  start: string;             // 'HH:mm'
  end: string;               // 'HH:mm'
  type: SessionType;
  location?: string;         // salle (in-person / hybrid)
  meetingProvider?: MeetingProvider;
  meetingLink?: string;      // online / hybrid
  description?: string;
  maxStudents?: number;
  status: SessionStatus;
  recurrenceId?: string;     // regroupe les occurrences générées
  attendance: AttendanceEntry[];
  createdAt: string;
}

export interface RecurrenceRule {
  enabled: boolean;
  days: number[];   // 0=Dim … 6=Sam
  weeks: number;    // durée en semaines
}

/** Payload de création / mise à jour (sans les champs gérés par le backend). */
export type SessionInput = Omit<Session, 'id' | 'attendance' | 'createdAt'>;

/** Filtres (admin / global). */
export interface CalendarFilters {
  teacherId: string;
  language: string;
  level: string;
  type: SessionType | '';
}

/** Couleurs par langue (identification rapide). */
export const LANGUAGE_COLORS: Record<string, string> = {
  English: '#2563EB',
  French: '#22C55E',
  Arabic: '#7C3AED',
  Spanish: '#F59E0B',
  German: '#EF4444',
  Italian: '#06B6D4',
};
export const langColor = (lang: string): string => LANGUAGE_COLORS[lang] ?? '#64748B';

export const SESSION_TYPE_META: Record<SessionType, { label: string; icon: string }> = {
  online: { label: 'Online', icon: 'videocam' },
  hybrid: { label: 'Hybrid', icon: 'cast' },
  'in-person': { label: 'In-Person', icon: 'meeting_room' },
};

export const STATUS_META: Record<SessionStatus, { label: string; badge: string }> = {
  scheduled: { label: 'Scheduled', badge: 'badge' },
  completed: { label: 'Completed', badge: 'badge-success' },
  cancelled: { label: 'Cancelled', badge: 'badge-danger' },
};

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; icon: string; color: string }> = {
  present: { label: 'Present', icon: 'check_circle', color: 'var(--success)' },
  absent:  { label: 'Absent',  icon: 'cancel',       color: 'var(--danger)' },
  late:    { label: 'Late',    icon: 'schedule',     color: 'var(--warning)' },
  excused: { label: 'Excused', icon: 'event_busy',   color: 'var(--text-muted)' },
};

export const PROVIDER_LABEL: Record<MeetingProvider, string> = {
  meet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams',
};

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Helpers de dates (sans dépendance) ──────────────────────────────
export const pad2 = (n: number): string => String(n).padStart(2, '0');
export const toISODate = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseISODate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Lundi de la semaine de `d`. */
export const startOfWeek = (d: Date): Date => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = lundi
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
export const sameDay = (a: Date, b: Date): boolean => toISODate(a) === toISODate(b);

export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Durée lisible : « 2h », « 1h30 », « 45 min ». */
export const durationLabel = (start: string, end: string): string => {
  const mins = Math.max(0, minutesOf(end) - minutesOf(start));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${pad2(m)}`;
};
