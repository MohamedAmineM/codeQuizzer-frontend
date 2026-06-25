/**
 * Configuration de PRODUCTION (utilisée par défaut par `ng build`).
 * ⚠️ Remplacer les URLs ci-dessous par celles de l'environnement de production
 * avant tout déploiement. En développement (`ng serve`), ce fichier est
 * remplacé par environment.development.ts via fileReplacements (angular.json).
 */
export const environment = {
  production: true,
  /** API Gateway — the single backend entry point. */
  apiUrl: 'https://api.example.com',
  keycloak: {
    url: 'https://auth.example.com',
    realm: 'mmnassri',
    clientId: 'quiz-app',
  },
};
