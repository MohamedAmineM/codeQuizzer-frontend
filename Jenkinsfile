// =============================================================================
//  CodeQuizzer Frontend — Pipeline CI/CD (Jenkins Declarative)
// -----------------------------------------------------------------------------
//  Checkout → Build (Angular prod, dans Docker) → Tests (headless, non bloquant)
//          → Image prod (multi-stage Node+Nginx) → Push Docker Hub → Deploy
//
//  Bonnes pratiques appliquées :
//   • Secrets via Jenkins Credentials (jamais de mot de passe en clair).
//   • Login Docker via --password-stdin (le secret n'apparaît pas en argument).
//   • Tags d'image : <BUILD_NUMBER> (immuable) + latest. Déploiement PINNÉ sur
//     le tag immuable → rollback déterministe.
//   • Portable Windows (bat) ⇄ Linux/K8s (sh) via les helpers runCmd/capture.
//   • Rollback automatique si le conteneur ne devient pas "healthy".
//   • L'agent n'a besoin que de Docker + Git (npm/ng tournent DANS Docker).
// =============================================================================

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '15'))
    }

    // Déclenchement automatique sur push GitHub (webhook déjà configuré côté repo).
    triggers {
        githubPush()
    }

    environment {
        // ⚠️ Docker Hub n'accepte QUE des minuscules dans les noms d'images.
        //    Le dépôt GitHub garde sa casse ; l'image, elle, est en minuscules.
        IMAGE          = 'mmnassri/codequizzer-frontend'
        CONTAINER_NAME = 'codequizzer-frontend'
        DOCKER_NETWORK = 'codequizzer-net'

        HOST_PORT      = '8081'   // port publié sur l'hôte (8080 = Jenkins lui-même sur l'hôte CI)
        CONTAINER_PORT = '80'     // port Nginx dans le conteneur

        DEPLOY_BRANCH  = 'claude-v4'
        GIT_URL        = 'https://github.com/MohamedAmineM/codeQuizzer-frontend.git'

        // Id du credential Jenkins (type Username with password) — voir CICD.md
        DOCKERHUB_CRED = 'dockerhub_cred'
    }

    stages {

        stage('Checkout') {
            steps {
                // Clone explicite de la branche déployée.
                // (Si le job est de type « Pipeline from SCM », `checkout scm` suffit.)
                git branch: "${DEPLOY_BRANCH}", url: "${GIT_URL}"
                script {
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}"
                    env.GIT_SHA   = capture('git rev-parse --short HEAD')
                    echo "Commit ${env.GIT_SHA} → image ${IMAGE}:${env.IMAGE_TAG} (+ latest)"
                }
            }
        }

        stage('Build (Angular prod)') {
            // npm ci + ng build --configuration=production s'exécutent DANS le
            // stage `build` du Dockerfile → échoue vite si la compilation casse.
            steps {
                script {
                    runCmd "docker build --target build -t ${IMAGE}:build-${IMAGE_TAG} ."
                }
            }
        }

        stage('Unit Tests (headless)') {
            // « si présents » : non bloquant → marque UNSTABLE plutôt que FAILED.
            // Pour rendre les tests bloquants : retirez le catchError.
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    script {
                        runCmd "docker build --target test -t ${IMAGE}:test-${IMAGE_TAG} ."
                    }
                }
            }
        }

        stage('Build Production Image (Nginx)') {
            steps {
                script {
                    // Image finale (réutilise le cache du stage build ci-dessus).
                    runCmd "docker build -t ${IMAGE}:${IMAGE_TAG} -t ${IMAGE}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                        credentialsId: "${DOCKERHUB_CRED}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        // Login SANS exposer le secret (stdin, pas en argument).
                        if (isUnix()) {
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        } else {
                            bat 'echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin'
                        }
                        runCmd "docker push ${IMAGE}:${IMAGE_TAG}"
                        runCmd "docker push ${IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // 1) Mémorise l'image actuellement déployée (pour rollback).
                    env.PREVIOUS_IMAGE = ''
                    try {
                        env.PREVIOUS_IMAGE = capture("docker inspect --format={{.Config.Image}} ${CONTAINER_NAME}")
                        echo "Image actuellement en service : ${env.PREVIOUS_IMAGE}"
                    } catch (ignored) {
                        echo 'Aucun conteneur existant — premier déploiement.'
                    }

                    // 2) Réseau dédié (idempotent) — prêt à accueillir un backend plus tard.
                    if (isUnix()) {
                        sh "docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || docker network create ${DOCKER_NETWORK}"
                    } else {
                        bat "docker network inspect ${DOCKER_NETWORK} >nul 2>&1 || docker network create ${DOCKER_NETWORK}"
                    }

                    // 3) Supprime l'ancien conteneur (idempotent).
                    removeContainer(this, "${CONTAINER_NAME}")

                    // 4) Démarre le nouveau conteneur PINNÉ sur le tag immuable.
                    runCmd "docker run -d --name ${CONTAINER_NAME} --network ${DOCKER_NETWORK} " +
                           "--restart unless-stopped -p ${HOST_PORT}:${CONTAINER_PORT} ${IMAGE}:${IMAGE_TAG}"

                    // 5) Attend l'état "healthy" (HEALTHCHECK du Dockerfile).
                    if (!waitHealthy(this, "${CONTAINER_NAME}", 18, 5)) {
                        error "Conteneur non 'healthy' → rollback (déclenché dans post.failure)."
                    }
                    echo "✅ Déployé : ${IMAGE}:${IMAGE_TAG} → http://<host>:${HOST_PORT}"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline OK — ${IMAGE}:${IMAGE_TAG} construit, poussé et déployé."
        }
        failure {
            script {
                echo '❌ Échec du pipeline — tentative de rollback…'
                rollback(this)
            }
        }
        always {
            // Logout + nettoyage des images intermédiaires/dangling (best-effort).
            script {
                catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                    runCmd 'docker logout'
                }
                catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                    if (isUnix()) { sh 'docker image prune -f >/dev/null 2>&1 || true' }
                    else          { bat 'docker image prune -f >nul 2>&1 || exit 0' }
                }
            }
        }
    }
}

// ── Helpers cross-plateforme (Windows `bat` aujourd'hui, Linux `sh` demain) ───

// Exécute une commande (sortie streamée dans le log).
def runCmd(String cmd) {
    if (isUnix()) { sh cmd } else { bat cmd }
}

// Exécute une commande et retourne sa sortie (trimée). `@` masque l'echo en bat.
def capture(String cmd) {
    return (isUnix() ? sh(returnStdout: true, script: cmd)
                     : bat(returnStdout: true, script: "@${cmd}")).trim()
}

// Supprime un conteneur s'il existe (idempotent, multi-OS).
void removeContainer(script, String name) {
    if (script.isUnix()) { script.sh  "docker rm -f ${name} >/dev/null 2>&1 || true" }
    else                 { script.bat "docker rm -f ${name} >nul 2>&1 || exit 0" }
}

// Poll l'état de santé Docker jusqu'à "healthy" (ou timeout). Retourne true/false.
boolean waitHealthy(script, String name, int retries, int delaySec) {
    for (int i = 0; i < retries; i++) {
        String status = 'unknown'
        try { status = script.capture("docker inspect -f {{.State.Health.Status}} ${name}") }
        catch (ignored) { status = 'unknown' }
        script.echo "Health check ${name} (${i + 1}/${retries}) : ${status}"
        if (status == 'healthy')   { return true  }
        if (status == 'unhealthy') { return false }
        script.sleep(time: delaySec, unit: 'SECONDS')
    }
    return false
}

// Rollback de base : redéploie l'image précédemment en service, si connue.
void rollback(script) {
    String prev = (script.env.PREVIOUS_IMAGE ?: '').trim()
    String name = script.env.CONTAINER_NAME
    if (!prev) {
        script.echo '⚠️ Aucune image précédente connue — rollback impossible (1er déploiement ?).'
        return
    }
    script.echo "↩️ Rollback → ${prev}"
    removeContainer(script, name)
    script.runCmd "docker run -d --name ${name} --network ${script.env.DOCKER_NETWORK} " +
                  "--restart unless-stopped -p ${script.env.HOST_PORT}:${script.env.CONTAINER_PORT} ${prev}"
    script.echo "✅ Rollback effectué sur ${prev}"
}
