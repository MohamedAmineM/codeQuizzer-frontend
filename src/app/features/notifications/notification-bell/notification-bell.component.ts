import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { notificationMeta, AppNotification } from '@shared/models/notification.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

/** Cloche de la navbar : badge non-lus + aperçu des 5 dernières notifications. */
@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, TimeAgoPipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent {

  readonly store = inject(NotificationService);
  readonly meta = notificationMeta;

  private readonly router = inject(Router);
  private readonly host = inject(ElementRef);

  open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
    // Rafraîchissement silencieux à l'ouverture — en attendant le temps
    // réel (WebSocket/SSE), c'est le moment où l'utilisateur veut du frais.
    if (this.open()) {
      this.store.refresh();
    }
  }

  close(): void {
    this.open.set(false);
  }

  openNotification(n: AppNotification): void {
    this.store.markAsRead(n.id);
    this.close();
    void this.router.navigate(['/notifications', n.id]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
