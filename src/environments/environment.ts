/**
 * Configuration de PRODUCTION (utilisée par défaut par `ng build`).
 * ⚠️ Remplacer les URLs ci-dessous par celles de l'environnement de production
 * avant tout déploiement. En développement (`ng serve`), ce fichier est
 * remplacé par environment.development.ts via fileReplacements (angular.json).
 */
export const environment = {
  production: true,
  /** API Gateway — the single backend entry point. */
  apiUrl: 'http://localhost:8888',
  keycloak: {
    url: 'http://localhost:8090',
    realm: 'mmnassri',
    clientId: 'quiz-app',
  },
};
