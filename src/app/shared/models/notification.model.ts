/**
 * Modèle du centre de notifications — contrat d'API avec le NOTIFICATION
 * SERVICE (microservice `notification`, routé : /api/notifications/**).
 * Miroir du NotificationDto Java ; le type DOIT rester aligné sur l'enum
 * NotificationType du backend (alimenté par les événements du backbone).
 */
export type NotificationType =
  | 'QUIZ_CREATED'
  | 'QUIZ_COMPLETED'
  | 'LEVEL_PROMOTION'
  | 'SESSION_CREATED'
  | 'DAILY_REMINDER'
  | 'SYSTEM'
  | 'ACHIEVEMENT'
  | 'PLACEMENT_COMPLETED'
  | 'PLACEMENT_APPROVED';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  /** ISO 8601 */
  createdAt: string;
}

export interface NotificationMeta { label: string; icon: string; color: string; }

export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationMeta> = {
  QUIZ_CREATED:        { label: 'Nouveau quiz',    icon: 'library_add',     color: 'var(--primary)' },
  QUIZ_COMPLETED:      { label: 'Quiz terminé',    icon: 'emoji_events',    color: 'var(--success)' },
  LEVEL_PROMOTION:     { label: 'Niveau atteint',  icon: 'trending_up',     color: 'var(--success)' },
  SESSION_CREATED:     { label: 'Nouvelle séance', icon: 'event_available', color: 'var(--primary)' },
  DAILY_REMINDER:      { label: 'Rappel',          icon: 'alarm',           color: 'var(--accent)' },
  SYSTEM:              { label: 'Système',         icon: 'settings',        color: 'var(--warning)' },
  ACHIEVEMENT:         { label: 'Succès',          icon: 'military_tech',   color: 'var(--accent)' },
  PLACEMENT_COMPLETED: { label: 'Test de placement', icon: 'fact_check',    color: 'var(--secondary)' },
  PLACEMENT_APPROVED:  { label: 'Niveau validé',   icon: 'verified',        color: 'var(--success)' },
};

/** Repli pour tout type non mappé (ne jamais casser l'affichage si le backend ajoute un type). */
export const DEFAULT_NOTIFICATION_META: NotificationMeta = {
  label: 'Notification', icon: 'notifications', color: 'var(--text-muted)',
};

/**
 * Métadonnées d'affichage d'un type de notification, TOLÉRANTES aux types inconnus.
 * Utilisé par tous les composants au lieu d'indexer la map directement — un type
 * non mappé renvoie un repli au lieu de produire une icône/couleur `undefined`.
 */
export function notificationMeta(type: NotificationType | string): NotificationMeta {
  return NOTIFICATION_TYPE_META[type as NotificationType] ?? DEFAULT_NOTIFICATION_META;
}
