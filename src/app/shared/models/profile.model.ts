/**
 * Profil métier de l'utilisateur courant — servi par l'IDENTITY SERVICE
 * (identitydb), aligné sur ProfileDto / PreferencesDto du backend :
 *   GET/PUT {apiUrl}/api/profiles/me
 *   GET/PUT {apiUrl}/api/preferences/me
 *
 * Keycloak reste la source de vérité des identités ; ce profil est créé à la
 * volée (JIT provisioning) au premier accès authentifié, à partir du JWT.
 */
export type ProfileType = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface UserProfile {
  id: string;
  keycloakUserId: string;
  type: ProfileType;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  phone: string | null;
  nativeLanguage: string | null;
  currentLevel: string | null;
  bio: string | null;
  createdAt: string | null;
}

export interface UserPreferences {
  theme: string;
  locale: string;
  timezone: string;
  emailEnabled: boolean;
  inappEnabled: boolean;
}

/** Champs modifiables via PUT /api/profiles/me (mise à jour partielle). */
export type UpdateProfile = Partial<
  Pick<UserProfile, 'displayName' | 'avatarUrl' | 'phone' | 'nativeLanguage' | 'bio'>
>;
