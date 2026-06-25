import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AppNotification, NOTIFICATION_TYPE_META } from '@shared/models/notification.model';

/**
 * Centre de notifications (NotificationSignal) — branché sur le NOTIFICATION
 * SERVICE via le gateway :
 *   GET    {apiUrl}/api/notifications
 *   PUT    {apiUrl}/api/notifications/{id}/read
 *   PUT    {apiUrl}/api/notifications/read-all
 *   DELETE {apiUrl}/api/notifications/{id}
 *
 * Les notifications sont produites côté backend par les événements RabbitMQ
 * (QuizCreatedEvent → étudiants, QuizCompletedEvent → enseignant créateur).
 * Temps réel à venir : un canal WebSocket/SSE remplacera le refresh manuel
 * sans changer cette interface.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  readonly loading = signal(true);
  readonly notifications = signal<AppNotification[]>([]);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);
  readonly latest = computed(() => this.notifications().slice(0, 5));

  constructor() {
    this.load();
  }

  /** Chargement initial (avec skeleton). */
  load(): void {
    this.loading.set(true);
    this.http.get<AppNotification[]>(this.baseUrl).subscribe({
      next: (list) => {
        this.applyList(list ?? [], 'load');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[notifications] load() failed', err);
        this.loading.set(false);
      },
    });
  }

  /** Rafraîchissement silencieux (ouverture de la cloche) — sans skeleton. */
  refresh(): void {
    this.http.get<AppNotification[]>(this.baseUrl).subscribe({
      next: (list) => this.applyList(list ?? [], 'refresh'),
      error: (err) => console.error('[notifications] refresh() failed', err),
    });
  }

  /**
   * Applique la liste reçue + trace de débogage (étape « récupération/affichage »).
   * Avertit si le backend renvoie un type non mappé côté frontend — cause typique
   * d'une notification « enregistrée mais mal affichée ».
   */
  private applyList(list: AppNotification[], stage: 'load' | 'refresh'): void {
    this.notifications.set(list);
    const unread = list.filter((n) => !n.read).length;
    console.debug(`[notifications] ${stage}: ${list.length} reçue(s), ${unread} non lue(s)`,
      list.map((n) => ({ id: n.id, type: n.type, read: n.read })));
    const unmapped = [...new Set(list.map((n) => n.type).filter((t) => !NOTIFICATION_TYPE_META[t]))];
    if (unmapped.length) {
      console.warn('[notifications] types non mappés (icône/couleur par défaut) :', unmapped);
    }
  }

  getById(id: string | number): AppNotification | undefined {
    return this.notifications().find((n) => String(n.id) === String(id));
  }

  /** Mise à jour optimiste + persistance côté serveur. */
  markAsRead(id: number): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    this.http.put(`${this.baseUrl}/${id}/read`, {}).subscribe({
      error: () => this.refresh(),   // désynchronisation → on resynchronise
    });
  }

  markAllAsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this.http.put(`${this.baseUrl}/read-all`, {}).subscribe({
      error: () => this.refresh(),
    });
  }

  delete(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
    this.http.delete(`${this.baseUrl}/${id}`).subscribe({
      error: () => this.refresh(),
    });
  }
}
