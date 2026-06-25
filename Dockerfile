###############################################################################
#  CodeQuizzer Frontend — Image de production (multi-stage : Node build → Nginx)
#  Résultat : une image Nginx légère servant le build Angular statique.
###############################################################################

ARG NODE_IMAGE=node:20-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — BUILD : installe les dépendances et compile Angular en production
# ─────────────────────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV CI=true

# 1) Couche dépendances isolée → ne se reconstruit QUE si le lockfile change
#    (cache Docker maximal, builds rapides).
COPY package.json package-lock.json ./
RUN npm ci

# 2) Sources + build prod (defaultConfiguration=production dans angular.json)
COPY . .
RUN npm run build -- --configuration=production

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — TEST (optionnel, non bloquant via Jenkins `--target test`)
#   Exécute les tests unitaires en Chromium headless (--no-sandbox pour Docker).
#   N'entre PAS dans l'image finale : seul `docker build --target test` l'exécute.
# ─────────────────────────────────────────────────────────────────────────────
FROM build AS test
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser
RUN npm run test -- --watch=false --browsers=ChromeHeadlessNoSandbox

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — RUNTIME : Nginx Alpine sert les fichiers statiques
# ─────────────────────────────────────────────────────────────────────────────
FROM ${NGINX_IMAGE} AS runtime

# Config Nginx adaptée SPA (fallback index.html, gzip, cache, headers sécurité)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Le builder Angular `application` émet les fichiers servis dans
# dist/<outputPath>/browser. Ici angular.json → outputPath = "dist/codeQuizzer".
# ⚠️ Si vous renommez outputPath dans angular.json, adaptez ce chemin.
COPY --from=build /app/dist/codeQuizzer/browser /usr/share/nginx/html

EXPOSE 80

# Sonde de santé : exploitée par Docker ET par le rollback Jenkins.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
