/**
 * Rôles applicatifs tels que définis dans le realm Keycloak
 * (token.realm_access.roles).
 */
export enum AppRole {
  Student = 'ROLE_STUDENT',
  Teacher = 'ROLE_TEACHER',
  Admin   = 'ROLE_ADMIN',
}

/** Ordre de précédence quand un utilisateur cumule plusieurs rôles. */
export const ROLE_PRIORITY: AppRole[] = [AppRole.Admin, AppRole.Teacher, AppRole.Student];

export const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.Admin]:   'Administrateur',
  [AppRole.Teacher]: 'Enseignant',
  [AppRole.Student]: 'Étudiant',
};
