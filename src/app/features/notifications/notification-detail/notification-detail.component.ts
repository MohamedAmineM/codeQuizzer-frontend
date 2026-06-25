import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AppNotification, notificationMeta } from '@shared/models/notification.model';

/** Page détail d'une notification — l'id arrive par input binding du router. */
@Component({
  selector: 'app-notification-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './notification-detail.component.html',
  styleUrl: './notification-detail.component.css'
})
export class NotificationDetailComponent {

  /** Fourni par withComponentInputBinding() (param :id de la route). */
  readonly id = input.required<string>();

  readonly store = inject(NotificationService);
  readonly meta = notificationMeta;
  private readonly router = inject(Router);

  readonly notification = computed(() => this.store.getById(this.id()));

  /** Action principale selon le type (même logique que la liste). */
  readonly action = computed<{ route: string; label: string } | null>(() => {
    const n = this.notification();
    if (!n) return null;
    switch (n.type) {
      case 'QUIZ_CREATED':   return { route: '/category', label: 'Start Learning Now' };
      case 'QUIZ_COMPLETED': return { route: '/teacher/quizzes', label: 'Voir mes quiz' };
      default:               return null;
    }
  });

  goToAction(): void {
    const action = this.action();
    if (action) void this.router.navigateByUrl(action.route);
  }

  deleteAndBack(n: AppNotification): void {
    this.store.delete(n.id);
    void this.router.navigate(['/notifications']);
  }
}
