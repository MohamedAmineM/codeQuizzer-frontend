import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { NavigationService } from '@core/services/navigation.service';
import { LayoutService } from '@core/services/layout.service';
import { ThemeService } from '@core/services/theme.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { NotificationService } from '@features/notifications/services/notification.service';
import { LanguageSwitcherComponent } from '@shared/components/language-switcher/language-switcher.component';

/**
 * Barre supérieure fixe (glassmorphism, 64px). Minimale : logo + Home /
 * Categories / Dashboard à gauche ; thème, notifications, avatar à droite.
 * « Dashboard » ouvre l'espace de travail (sidebar) ; le hamburger fait de
 * même en mode compact.
 */
@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent, TranslatePipe],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.css',
})
export class TopNavComponent {

  readonly auth = inject(AuthService);
  readonly nav = inject(NavigationService);
  readonly layout = inject(LayoutService);
  readonly theme = inject(ThemeService);
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef);

  readonly dropdownOpen = signal(false);

  toggleDropdown(): void { this.dropdownOpen.update((v) => !v); }
  closeDropdown(): void { this.dropdownOpen.set(false); }

  /** Bouton « Dashboard » : ouvre l'espace de travail et y navigue. */
  openWorkspace(): void {
    this.layout.openSidebar();
    void this.router.navigate(['/dashboard']);
  }

  /** Hamburger (mode compact) : ouvre/ferme le tiroir sidebar. */
  toggleSidebar(): void { this.layout.toggleSidebar(); }

  openNotifications(): void {
    this.closeDropdown();
    this.layout.toggleNotif();
  }

  openCommandPalette(): void { this.layout.openPalette(); }

  accountSettings(): void {
    this.closeDropdown();
    this.auth.manageAccount();
  }

  login(): void { this.auth.login(); }

  logout(): void {
    this.closeDropdown();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
    }
  }
}
