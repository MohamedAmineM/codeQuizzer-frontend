import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AppNotification, notificationMeta, NotificationType } from '@shared/models/notification.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

type Filter = 'ALL' | 'UNREAD' | NotificationType;

@Component({
  selector: 'app-notifications-page',
  imports: [TimeAgoPipe],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent {

  readonly store = inject(NotificationService);
  readonly meta = notificationMeta;
  private readonly router = inject(Router);

  readonly filter = signal<Filter>('ALL');

  readonly filters: { value: Filter; label: string }[] = [
    { value: 'ALL',            label: 'Toutes' },
    { value: 'UNREAD',         label: 'Non lues' },
    { value: 'QUIZ_CREATED',   label: 'Nouveaux quiz' },
    { value: 'QUIZ_COMPLETED', label: 'Quiz terminés' },
    { value: 'ACHIEVEMENT',    label: 'Succès' },
    { value: 'SYSTEM',         label: 'Système' },
  ];

  readonly visible = computed(() => {
    const f = this.filter();
    const list = this.store.notifications();
    if (f === 'ALL') return list;
    if (f === 'UNREAD') return list.filter((n) => !n.read);
    return list.filter((n) => n.type === f);
  });

  /** Action principale selon le type (le backend n'envoie pas de meta). */
  actionFor(n: AppNotification): { route: string; label: string } | null {
    switch (n.type) {
      case 'QUIZ_CREATED':   return { route: '/category', label: 'Start Learning Now' };
      case 'QUIZ_COMPLETED': return { route: '/teacher/quizzes', label: 'Voir mes quiz' };
      default:               return null;
    }
  }

  openDetail(n: AppNotification): void {
    this.store.markAsRead(n.id);
    void this.router.navigate(['/notifications', n.id]);
  }

  onAction(event: MouseEvent, n: AppNotification): void {
    event.stopPropagation();
    this.store.markAsRead(n.id);
    const action = this.actionFor(n);
    if (action) void this.router.navigateByUrl(action.route);
  }

  onDelete(event: MouseEvent, n: AppNotification): void {
    event.stopPropagation();
    this.store.delete(n.id);
  }
}
