import { Injectable, Signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Vérifications d'autorisation centralisées. Les composants et le routing
 * passent par ce service plutôt que d'inspecter le token eux-mêmes.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {

  private readonly auth = inject(AuthService);

  hasRole(role: string): boolean {
    return this.auth.authenticated() && this.auth.roles().includes(role);
  }

  hasAnyRole(roles: readonly string[]): boolean {
    if (roles.length === 0) return this.auth.authenticated();
    return this.auth.authenticated() && roles.some((r) => this.auth.roles().includes(r));
  }

  /** Variante réactive, utilisable directement dans un template. */
  can(roles: readonly string[]): Signal<boolean> {
    return computed(() => this.hasAnyRole(roles));
  }
}
