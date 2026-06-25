import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AppRole } from '@core/auth/roles';
import { AdminUser, CreateUserPayload, PageResponse } from '@shared/models/app-user.model';

/**
 * Gestion des utilisateurs (écran admin « User Management »).
 *
 * Branché sur le backend via le gateway :
 *   GET {apiUrl}/api/admin/users?page&size&search&role   →  identity-service
 *
 * Les comptes proviennent de Keycloak (source de vérité), exposés par
 * identity-service via un compte de service à moindre privilège. Pagination /
 * recherche / filtre par rôle sont résolus côté serveur — l'UI ne charge jamais
 * tout l'annuaire.
 */
@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/users`;

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  /** Charge une page (pagination/recherche/filtre poussés au backend). */
  load(params: { page?: number; search?: string; role?: string } = {}): void {
    const page = Math.max(params.page ?? 0, 0);
    this.loading.set(true);
    this.error.set(false);

    let httpParams = new HttpParams().set('page', page).set('size', this.size());
    const search = params.search?.trim();
    if (search) httpParams = httpParams.set('search', search);
    if (params.role && params.role !== 'ALL') httpParams = httpParams.set('role', params.role);

    this.http.get<PageResponse<AdminUser>>(this.baseUrl, { params: httpParams }).subscribe({
      next: (res) => {
        this.users.set(res.content ?? []);
        this.page.set(res.page);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor — on bascule en état d'erreur.
      error: () => {
        this.users.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  // ── Mutations (admin) — branchées sur identity-service (Keycloak Admin API) ──

  /** Crée un utilisateur (compte Keycloak + profil métier). Renvoie la fiche créée. */
  createUser(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.baseUrl, payload);
  }

  /** Liste des enseignants (pour les sélecteurs d'affectation de matières). */
  listTeachers(): Observable<AdminUser[]> {
    const params = new HttpParams().set('page', 0).set('size', 100).set('role', AppRole.Teacher);
    return this.http.get<PageResponse<AdminUser>>(this.baseUrl, { params }).pipe(map(r => r.content ?? []));
  }

  /** Change le rôle effectif de l'utilisateur. Renvoie la fiche à jour. */
  changeRole(userId: string, role: AppRole): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${userId}/role`, { role });
  }

  /** Suspend (enabled=false) ou réactive (enabled=true) le compte. Renvoie la fiche à jour. */
  setStatus(userId: string, enabled: boolean): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${userId}/status`, { enabled });
  }

  /** Réinitialise le mot de passe (temporaire — changement forcé à la prochaine connexion). */
  resetPassword(userId: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${userId}/reset-password`, { password });
  }
}
