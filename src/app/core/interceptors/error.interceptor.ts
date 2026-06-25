import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';
import { ToastService } from '@core/services/toast.service';

/**
 * Gestion centralisée des erreurs HTTP :
 *  - 401 : session expirée ou token invalide → ré-authentification via Keycloak ;
 *  - 403 : droits insuffisants → notification ;
 *  - 0   : serveur injoignable → notification.
 * L'erreur est ensuite re-propagée pour que l'appelant puisse réagir.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);
  const notify = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        keycloak.login({ redirectUri: window.location.href });
      } else if (error.status === 403) {
        notify.error("Vous n'avez pas les droits nécessaires pour cette action.");
      } else if (error.status === 0) {
        notify.error('Serveur injoignable. Vérifiez votre connexion.');
      }
      return throwError(() => error);
    })
  );
};
