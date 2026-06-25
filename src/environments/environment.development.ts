export const environment = {
  production: false,
  /** API Gateway — the single backend entry point. */
  apiUrl: 'http://localhost:8888',
  keycloak: {
    url: 'http://localhost:8090',
    realm: 'mmnassri',
    clientId: 'quiz-app',
  },
};
