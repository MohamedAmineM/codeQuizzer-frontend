import { AppRole } from '@core/auth/roles';

/** Modèles d'administration — futur Keycloak Admin API. */

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Rôle effectif le plus élevé ; peut être null si l'utilisateur n'a aucun rôle applicatif. */
  role: AppRole | null;
  status: UserStatus;
  /** ISO 8601 — peut être null pour les comptes importés (pas de createdTimestamp). */
  createdAt: string | null;
}

/** Corps de création d'un utilisateur (POST /api/admin/users). */
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: AppRole;
  password: string;
  /** Champs de profil métier — optionnels. */
  phone?: string | null;
  nativeLanguage?: string | null;
  currentLevel?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

/** Réponse paginée générique renvoyée par le backend (PageResponse<T>). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminDashboardStats {
  usersCount: number;
  teachersCount: number;
  studentsCount: number;
  quizzesCount: number;
  categoriesCount: number;
  notificationsCount: number;
}

export type HealthStatus = 'UP' | 'DEGRADED' | 'DOWN';

export interface SystemHealthItem {
  service: string;
  status: HealthStatus;
  latencyMs: number;
}

export interface ActivityItem {
  id: string;
  icon: string;
  label: string;
  detail: string;
  /** ISO 8601 */
  timestamp: string;
}

export const USER_STATUS_META: Record<UserStatus, { label: string; cssClass: string }> = {
  ACTIVE:    { label: 'Actif',     cssClass: 'badge-success' },
  SUSPENDED: { label: 'Suspendu',  cssClass: 'badge-danger' },
  PENDING:   { label: 'En attente', cssClass: 'badge-warning' },
};
