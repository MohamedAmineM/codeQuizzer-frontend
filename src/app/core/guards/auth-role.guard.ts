import { AuthGuardData, createAuthGuard } from 'keycloak-angular';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

/**
 * RoleGuard basé sur Keycloak :
 *  - non connecté            → redirection vers le login Keycloak, puis retour sur la page demandée ;
 *  - connecté sans rôle      → page /forbidden ;
 *  - route sans data.roles   → l'authentification seule suffit.
 *
 * Usage :
 *   canActivate: [canActivateAuthRole]                                  // authentification seule
 *   canActivate: [canActivateAuthRole], data: { roles: [AppRole.Admin] } // rôle(s) requis
 */
const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles } = authData;

  if (!authenticated) {
    const keycloak = inject(Keycloak);
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }

  // `roles` (tableau) est la forme canonique ; `role` reste supporté.
  const requiredRoles: string[] = route.data['roles'] ?? (route.data['role'] ? [route.data['role']] : []);
  if (requiredRoles.length === 0) {
    return true;
  }

  // Vérifie les rôles realm et les rôles client (resource) du token.
  const hasRequiredRole = requiredRoles.some(
    (role) =>
      grantedRoles.realmRoles.includes(role) ||
      Object.values(grantedRoles.resourceRoles).some((roles) => roles.includes(role))
  );

  if (hasRequiredRole) {
    return true;
  }

  return inject(Router).parseUrl('/forbidden');
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);
