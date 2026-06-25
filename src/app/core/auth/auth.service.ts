import { Injectable, computed, effect, inject, signal } from '@angular/core';
import Keycloak, { KeycloakProfile } from 'keycloak-js';
import {
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakEventType,
  ReadyArgs,
  typeEventArgs
} from 'keycloak-angular';
import { AppRole, ROLE_LABELS, ROLE_PRIORITY } from './roles';

/**
 * Source de vérité unique de l'état d'authentification, exposée en signals :
 *  - authenticated (AuthSignal)
 *  - user          (UserSignal)
 *  - roles         (RoleSignal)
 * Les composants ne parlent jamais directement à keycloak-js.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly keycloak = inject(Keycloak);
  private readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);

  readonly authenticated = signal(false);
  readonly user = signal<KeycloakProfile | undefined>(undefined);
  readonly roles = signal<readonly string[]>([]);

  /** Rôle le plus élevé de l'utilisateur (Admin > Teacher > Student). */
  readonly primaryRole = computed<AppRole | null>(
    () => ROLE_PRIORITY.find((r) => this.roles().includes(r)) ?? null
  );

  readonly roleLabel = computed(() => {
    const role = this.primaryRole();
    return role ? ROLE_LABELS[role] : '';
  });

  readonly isStudent = computed(() => this.roles().includes(AppRole.Student));
  readonly isTeacher = computed(() => this.roles().includes(AppRole.Teacher));
  readonly isAdmin   = computed(() => this.roles().includes(AppRole.Admin));

  readonly fullName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '';
  });

  readonly avatarLetter = computed(() => {
    const u = this.user();
    return (u?.firstName || u?.username || '?').charAt(0).toUpperCase();
  });

  constructor() {
    effect(() => {
      const event = this.keycloakSignal();

      if (event.type === KeycloakEventType.Ready) {
        const isAuth = typeEventArgs<ReadyArgs>(event.args);
        this.authenticated.set(isAuth);
        if (isAuth) {
          this.syncRolesFromToken();
          void this.loadProfile();
        }
      }

      if (event.type === KeycloakEventType.AuthRefreshSuccess) {
        this.syncRolesFromToken();
      }

      if (event.type === KeycloakEventType.AuthLogout) {
        this.authenticated.set(false);
        this.user.set(undefined);
        this.roles.set([]);
      }
    });
  }

  login(redirectPath?: string): void {
    void this.keycloak.login({
      redirectUri: window.location.origin + (redirectPath ?? window.location.pathname)
    });
  }

  logout(): void {
    void this.keycloak.logout({ redirectUri: window.location.origin });
  }

  /** Console "Mon compte" de Keycloak (changement de mot de passe, etc.). */
  manageAccount(): void {
    void this.keycloak.accountManagement();
  }

  private syncRolesFromToken(): void {
    this.roles.set(this.keycloak.tokenParsed?.realm_access?.roles ?? []);
  }

  private async loadProfile(): Promise<void> {
    try {
      this.user.set(await this.keycloak.loadUserProfile());
    } catch {
      this.user.set(undefined);
    }
  }
}
