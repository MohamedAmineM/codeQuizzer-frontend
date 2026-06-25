import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Premier login : si l'étudiant connecté n'a encore aucune inscription, on le
 * redirige vers l'écran de choix des langues (/languages/enroll). Sinon il
 * accède normalement à « My Languages ». En cas d'erreur réseau on laisse
 * passer (errorInterceptor a déjà notifié) pour ne pas bloquer l'utilisateur.
 */
export const firstLoginGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  return http.get<{ enrolled: boolean }>(`${environment.apiUrl}/api/enrollments/me/exists`).pipe(
    map((r) => (r.enrolled ? true : router.parseUrl('/languages/enroll'))),
    catchError(() => of(true)),
  );
};
