import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@core/services/layout.service';
import { ToastService } from '@core/services/toast.service';
import { ProfileService } from '@features/profile/services/profile.service';
import { PlacementApiService } from '@features/placement/services/placement-api.service';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { TopNavComponent } from './layout/top-nav/top-nav.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NotificationDrawerComponent } from './layout/notification-drawer/notification-drawer.component';
import { CommandPaletteComponent } from './layout/command-palette/command-palette.component';

/**
 * Shell applicatif : top-nav fixe + espace de travail (sidebar + contenu qui
 * se redimensionne) + tiroir de notifications + palette de commandes + toasts.
 * L'ouverture de la sidebar suit la route en desktop ; manuelle en compact.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FooterComponent,
    TopNavComponent,
    SidebarComponent,
    NotificationDrawerComponent,
    CommandPaletteComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {

  readonly auth = inject(AuthService);
  readonly layout = inject(LayoutService);
  readonly notify = inject(ToastService);
  private readonly router = inject(Router);
  private readonly profile = inject(ProfileService);
  private readonly placement = inject(PlacementApiService);

  private readonly workspaceRoute = signal(false);
  /** Garde-fou : la redirection « 1er login → placement » ne se déclenche qu'une fois par session. */
  private placementRedirectDone = false;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.workspaceRoute.set(this.layout.isWorkspaceUrl(e.urlAfterRedirects)));

    // Desktop : toute route de l'espace de travail ouvre la sidebar ; les
    // pages publiques (Home, Categories…) la referment. En compact, l'ouverture
    // reste manuelle (hamburger) — on ne la pilote pas par la route.
    effect(() => {
      const inWorkspace = this.workspaceRoute() && this.auth.authenticated();
      if (!this.layout.compact()) {
        this.layout.sidebarOpen.set(inWorkspace);
      }
    });

    // JIT provisioning : dès qu'un utilisateur est authentifié (tous rôles), on
    // s'assure que son profil métier existe côté identity-service — créé à partir
    // du JWT au 1er GET /api/profiles/me. Idempotent (un appel par session).
    effect(() => {
      if (this.auth.authenticated()) {
        this.profile.ensureProvisioned();
      }
    });

    // 1er login d'un étudiant non encore placé → redirection douce vers le test de
    // placement (une seule fois par session). « Douce » : il peut ensuite naviguer
    // ailleurs ; un rappel reste sur l'écran de placement tant qu'il ne l'a pas passé.
    effect(() => {
      if (this.placementRedirectDone) return;
      if (!this.auth.authenticated() || !this.auth.isStudent()) return;
      const studentId = this.auth.user()?.id;
      if (!studentId) return; // on attend que le profil Keycloak soit chargé
      this.placementRedirectDone = true;
      this.placement.exists().subscribe((has) => {
        if (!has) void this.router.navigate(['/learning/placement']);
      });
    });
  }
}
