import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { CefrLevel, PlacementResult } from '../models/placement.model';

/**
 * Accès HTTP au test de placement (learning-service via le gateway).
 * Remplace l'ancien stockage localStorage : tout est persisté côté serveur,
 * le test ne peut être passé qu'une seule fois (contrainte backend), et la
 * soumission / l'approbation déclenchent des notifications (event-driven).
 *
 *   POST   /api/placements                       (étudiant) soumet son résultat
 *   GET    /api/placements/me                     (étudiant) son dernier résultat (204 si aucun)
 *   GET    /api/placements/me/exists              (étudiant) a-t-il déjà passé le test ?
 *   GET    /api/placements/teacher                (enseignant) liste (dernier par étudiant)
 *   GET    /api/placements/teacher/{id}           (enseignant) un résultat
 *   PUT    /api/placements/teacher/{id}/approve   (enseignant) valide le niveau proposé
 *   PUT    /api/placements/teacher/{id}/override  (enseignant) impose un niveau
 *   PUT    /api/placements/teacher/{id}/comment   (enseignant) commentaire
 */
@Injectable({ providedIn: 'root' })
export class PlacementApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/placements`;

  // ── Étudiant ────────────────────────────────────────────────────────
  submit(result: PlacementResult): Observable<PlacementResult> {
    return this.http.post<PlacementResult>(this.baseUrl, result);
  }

  /** Dernier résultat de l'étudiant courant (null si pas encore passé — 204). */
  myResult(): Observable<PlacementResult | null> {
    return this.http.get<PlacementResult>(`${this.baseUrl}/me`).pipe(map((r) => r ?? null));
  }

  exists(): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`${this.baseUrl}/me/exists`).pipe(map((r) => r.exists));
  }

  // ── Enseignant ──────────────────────────────────────────────────────
  teacherList(): Observable<PlacementResult[]> {
    return this.http.get<PlacementResult[]>(`${this.baseUrl}/teacher`).pipe(map((l) => l ?? []));
  }

  byId(id: string): Observable<PlacementResult> {
    return this.http.get<PlacementResult>(`${this.baseUrl}/teacher/${id}`);
  }

  approve(id: string): Observable<PlacementResult> {
    return this.http.put<PlacementResult>(`${this.baseUrl}/teacher/${id}/approve`, {});
  }

  override(id: string, level: CefrLevel): Observable<PlacementResult> {
    return this.http.put<PlacementResult>(`${this.baseUrl}/teacher/${id}/override`, { level });
  }

  setComment(id: string, comment: string): Observable<PlacementResult> {
    return this.http.put<PlacementResult>(`${this.baseUrl}/teacher/${id}/comment`, { comment });
  }
}
