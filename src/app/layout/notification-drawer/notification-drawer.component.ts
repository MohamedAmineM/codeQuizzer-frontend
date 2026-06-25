import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LayoutService } from '@core/services/layout.service';
import { NotificationService } from '@features/notifications/services/notification.service';
import { AppNotification, notificationMeta } from '@shared/models/notification.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

type NotifFilter = 'all' | 'unread';

/**
 * Tiroir de notifications coulissant depuis la droite. Filtre (toutes / non
 * lues), « tout marquer lu », activité récente. Piloté par LayoutService.notifOpen.
 */
@Component({
  selector: 'app-notification-drawer',
  imports: [RouterLink, TimeAgoPipe],
  templateUrl: './notification-drawer.component.html',
  styleUrl: './notification-drawer.component.css',
})
export class NotificationDrawerComponent {

  readonly store = inject(NotificationService);
  readonly layout = inject(LayoutService);
  readonly meta = notificationMeta;
  private readonly router = inject(Router);

  readonly filter = signal<NotifFilter>('all');

  readonly visible = computed(() => {
    const list = this.store.notifications();
    return this.filter() === 'unread' ? list.filter((n) => !n.read) : list;
  });

  setFilter(f: NotifFilter): void { this.filter.set(f); }

  close(): void { this.layout.closeNotif(); }

  openNotification(n: AppNotification): void {
    this.store.markAsRead(n.id);
    this.close();
    void this.router.navigate(['/notifications', n.id]);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.layout.notifOpen()) this.close();
  }
}
