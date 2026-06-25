import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { UpdateProfile, UserPreferences, UserProfile } from '@shared/models/profile.model';

/**
 * Profil & préférences de l'utilisateur courant — branché sur l'IDENTITY SERVICE
 * via le gateway :
 *   GET/PUT {apiUrl}/api/profiles/me
 *   GET/PUT {apiUrl}/api/preferences/me
 * Le bearer token Keycloak est injecté automatiquement (includeBearerTokenInterceptor).
 *
 * `ensureProvisioned()` amorce le JIT provisioning : au premier login, le GET
 * /api/profiles/me crée le profil métier côté backend (à partir du claim `sub`
 * du JWT) s'il n'existe pas. Déclenché une fois par session depuis AppComponent,
 * pour TOUS les rôles (le firstLoginGuard, lui, ne couvre que le flux étudiant).
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  readonly profile = signal<UserProfile | null>(null);
  readonly preferences = signal<UserPreferences | null>(null);

  /** Évite les appels en double ; remis à false sur erreur pour permettre une nouvelle tentative. */
  private provisioned = false;

  /** JIT provisioning — idempotent (un seul appel réussi par session). */
  ensureProvisioned(): void {
    if (this.provisioned) return;
    this.provisioned = true;
    this.http.get<UserProfile>(`${this.baseUrl}/profiles/me`).subscribe({
      next: (p) => this.profile.set(p),
      error: () => { this.provisioned = false; },  // errorInterceptor a déjà notifié
    });
  }

  /**
   * Mise à jour partielle du profil : rafraîchit le signal et renvoie l'Observable
   * pour que l'appelant gère le feedback UI (toast succès / erreur).
   */
  updateProfile(patch: UpdateProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profiles/me`, patch).pipe(
      tap((p) => this.profile.set(p)),
    );
  }

  /** Chargement à la demande des préférences UI (écran Préférences). */
  loadPreferences(): void {
    this.http.get<UserPreferences>(`${this.baseUrl}/preferences/me`).subscribe({
      next: (p) => this.preferences.set(p),
    });
  }

  updatePreferences(patch: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.baseUrl}/preferences/me`, patch).pipe(
      tap((p) => this.preferences.set(p)),
    );
  }
}
