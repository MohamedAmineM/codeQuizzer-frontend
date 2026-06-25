import {
  provideKeycloak,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  withAutoRefreshToken,
  AutoRefreshTokenService,
  UserActivityService
} from 'keycloak-angular';
import { environment } from '../environments/environment';

// Attach the bearer token only to calls that target the API gateway.
const escapedApiUrl = environment.apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const gatewayCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: new RegExp(`^(${escapedApiUrl})(\\/.*)?$`, 'i')
});

export const provideKeycloakAngular = () =>
  provideKeycloak({
    config: {
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    },
    initOptions: {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      // PKCE S256 : défaut de keycloak-js 26, rendu explicite volontairement.
      pkceMethod: 'S256'
      // Pas de redirectUri forcé : l'utilisateur revient sur la page où il était.
    },
    features: [
      withAutoRefreshToken({
        onInactivityTimeout: 'logout',
        sessionTimeout: 1800000
      })
    ],
    providers: [
      AutoRefreshTokenService,
      UserActivityService,
      {
        provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
        useValue: [gatewayCondition]
      }
    ]
  });
