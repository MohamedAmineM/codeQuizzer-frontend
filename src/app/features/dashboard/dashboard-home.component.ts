import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { NavigationService } from '@core/services/navigation.service';
import { LayoutService } from '@core/services/layout.service';
import { NotificationService } from '@features/notifications/services/notification.service';
import { UpcomingWidgetComponent } from '@features/calendar/components/upcoming-widget.component';

/**
 * Page d'accueil de l'espace de travail (« Dashboard Overview »). Landing
 * neutre vis-à-vis du rôle : salutation + accès rapide à toutes les sections
 * de la sidebar filtrées pour l'utilisateur courant.
 */
@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, UpcomingWidgetComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent {

  readonly auth = inject(AuthService);
  readonly nav = inject(NavigationService);
  readonly layout = inject(LayoutService);
  readonly notifications = inject(NotificationService);

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  /** Première personne du nom, pour une salutation chaleureuse. */
  readonly firstName = computed(() => this.auth.fullName().split(' ')[0] || 'there');
}
