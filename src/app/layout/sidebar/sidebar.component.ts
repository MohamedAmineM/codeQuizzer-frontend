import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavigationService, NavItem } from '@core/services/navigation.service';
import { LayoutService } from '@core/services/layout.service';
import { AuthService } from '@core/auth/auth.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { NotificationService } from '@features/notifications/services/notification.service';

/**
 * Sidebar de l'espace de travail. Coulisse depuis la gauche (300ms),
 * réductible (280 ↔ 80px) avec tooltips, sections filtrées par rôle.
 * En mode compact, devient un tiroir plein écran avec backdrop.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {

  readonly nav = inject(NavigationService);
  readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);

  /** Badge dynamique (non-lus) pour l'item Notifications. */
  badgeFor(item: NavItem): number {
    return item.route === '/notifications' ? this.notifications.unreadCount() : 0;
  }

  /** En mode compact, sélectionner un item referme le tiroir. */
  onItemClick(): void {
    if (this.layout.compact()) this.layout.closeSidebar();
  }
}
