import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';

import { ToastService } from '@core/services/toast.service';

/** Délai avant redirection automatique vers l'accueil (secondes). */
const REDIRECT_SECONDS = 10;

/** Rôles techniques Keycloak à masquer dans l'interface. */
const TECHNICAL_ROLES = new Set(['offline_access', 'uma_authorization']);

interface DecodedToken {
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
}

@Component({
  selector: 'app-forbidden',
  imports: [RouterModule],
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.css']
})
export class ForbiddenComponent implements OnInit, OnDestroy {

  private readonly keycloak = inject(Keycloak);
  private readonly router = inject(Router);
  private readonly notify = inject(ToastService);

  authenticated = signal(false);
  fullName = signal('');
  roles = signal<string[]>([]);

  /** Compte à rebours avant redirection automatique. */
  countdown = signal(REDIRECT_SECONDS);
  redirectCancelled = signal(false);

  avatarLetter = computed(() => (this.fullName() || '?').charAt(0).toUpperCase());

  /** Progression (0 → 100) de la barre du compte à rebours. */
  countdownProgress = computed(() => (this.countdown() / REDIRECT_SECONDS) * 100);

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadIdentity();
    this.startCountdown();
    this.notify.error('Access denied — your current role does not grant access to this resource.');
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /** Lit le nom et les rôles depuis le token Keycloak (synchrone, pas d'appel réseau). */
  private loadIdentity(): void {
    if (!this.keycloak?.authenticated) return;

    this.authenticated.set(true);
    const token = (this.keycloak.tokenParsed ?? {}) as DecodedToken;

    const name =
      token.name ||
      [token.given_name, token.family_name].filter(Boolean).join(' ') ||
      token.preferred_username ||
      '';
    this.fullName.set(name);

    const roles = (token.realm_access?.roles ?? []).filter(
      r => !TECHNICAL_ROLES.has(r) && !r.startsWith('default-roles')
    );
    this.roles.set(roles);
  }

  private startCountdown(): void {
    this.timer = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) {
        this.stopCountdown();
        this.router.navigateByUrl('/');
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** WCAG 2.2.1 — l'utilisateur doit pouvoir annuler toute limite de temps. */
  cancelRedirect(): void {
    this.stopCountdown();
    this.redirectCancelled.set(true);
  }

  /** Fonctionnalité à venir : demande d'élévation de rôle. */
  requestRole(): void {
    this.notify.info('Role requests are coming soon. Meanwhile, please contact the administrator.');
  }
}
