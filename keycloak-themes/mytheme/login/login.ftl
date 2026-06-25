<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Sign in — QuizCodder</title>
  <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/logo.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${url.resourcesPath}/css/custom.css">
</head>
<body>

<div class="auth-shell">

  <!-- ════════ LEFT : FORM ════════ -->
  <section class="auth-left" aria-label="Sign in form">
    <div class="auth-card">

      <a class="brand" href="#" tabindex="-1">
        <img src="${url.resourcesPath}/img/logo.svg" alt="QuizCodder logo" width="44" height="44">
        <span class="brand-name">Quiz<span class="brand-accent">Codder</span></span>
      </a>

      <h1 class="auth-title">Welcome Back</h1>
      <p class="auth-subtitle">Continue your learning journey</p>

      <#-- Messages : ne jamais exposer d'erreur technique. Erreur d'auth → message générique. -->
      <#if message?has_content>
        <#if message.type = 'error'>
          <div class="alert alert-error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 6.3a1 1 0 011.4 1.4L8.4 9.4l1.7 1.7a1 1 0 01-1.4 1.4L7 10.8l-1.7 1.7a1 1 0 01-1.4-1.4l1.7-1.7-1.7-1.7a1 1 0 011.4-1.4L7 8l1.7-1.7z" clip-rule="evenodd"/></svg>
            Invalid email or password
          </div>
        <#elseif message.type = 'success'>
          <div class="alert alert-success" role="status">${kcSanitize(message.summary)?no_esc}</div>
        <#elseif message.type = 'info'>
          <div class="alert alert-info" role="status">${kcSanitize(message.summary)?no_esc}</div>
        </#if>
      </#if>

      <#-- GitHub / social providers en premier (pattern GitHub/Notion) -->
      <#if social?? && social.providers?? && social.providers?has_content>
        <div class="social-list">
          <#list social.providers as p>
            <#if p.alias == 'github'>
              <a class="btn-social btn-github" href="${p.loginUrl}" rel="nofollow">
                <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Continue with GitHub
              </a>
            <#else>
              <a class="btn-social" href="${p.loginUrl}" rel="nofollow">Continue with ${p.displayName!}</a>
            </#if>
          </#list>
        </div>

        <div class="divider" role="separator"><span>OR</span></div>
      </#if>

      <#-- Formulaire — l'action Keycloak contient le session_code (protection CSRF native) -->
      <form id="kc-form-login" action="${url.loginAction}" method="post" novalidate>

        <div class="field">
          <label for="username">Email</label>
          <input id="username" name="username" type="email"
                 value="${(login.username)!''}"
                 placeholder="you@example.com"
                 autocomplete="username"
                 autofocus required
                 aria-required="true">
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input id="password" name="password" type="password"
                   placeholder="••••••••"
                   autocomplete="current-password"
                   required aria-required="true">
            <button type="button" class="toggle-password" data-target="password"
                    aria-label="Show password" aria-pressed="false">
              <svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="display:none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 19c-6.5 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <div class="form-row">
          <#if realm.rememberMe??>
            <label class="checkbox">
              <input type="checkbox" id="rememberMe" name="rememberMe" <#if login.rememberMe??>checked</#if>>
              <span>Remember me</span>
            </label>
          </#if>
          <#if realm.resetPasswordAllowed>
            <a class="link" href="${url.loginResetCredentialsUrl}">Forgot password?</a>
          </#if>
        </div>

        <#if auth?? && auth.selectedCredential?has_content>
          <input type="hidden" name="credentialId" value="${auth.selectedCredential}">
        </#if>

        <button type="submit" class="btn-primary" id="kc-login" name="login">
          <span class="btn-label">Sign In</span>
          <span class="btn-spinner" aria-hidden="true"></span>
        </button>

      </form>

      <#if realm.registrationAllowed && !registrationDisabled??>
        <p class="bottom-text">
          New to QuizCodder?
          <a class="link" href="${url.registrationUrl}">Create an account</a>
        </p>
      </#if>

      <div class="trust-row" aria-label="Security guarantees">
        <span class="trust-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Secure session
        </span>
        <span class="trust-item">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          HTTPS &amp; CSRF protected
        </span>
      </div>

    </div>
  </section>

  <!-- ════════ RIGHT : ILLUSTRATION ════════ -->
  <aside class="auth-right" aria-hidden="true">
    <div class="right-bg"></div>
    <div class="floating-glow g1"></div>
    <div class="floating-glow g2"></div>

    <div class="right-content">

      <!-- Mockup code window -->
      <div class="mock-window">
        <div class="mock-titlebar"><span></span><span></span><span></span></div>
        <pre class="mock-code"><code><span class="c-key">const</span> <span class="c-var">quiz</span> = <span class="c-key">await</span> <span class="c-fn">startQuiz</span>(<span class="c-str">'Angular'</span>);

<span class="c-key">if</span> (quiz.<span class="c-var">score</span> &gt; <span class="c-num">90</span>) {
  <span class="c-fn">unlockBadge</span>(<span class="c-str">'Expert'</span>); <span class="c-cmt">// 🏆</span>
}</code></pre>
      </div>

      <!-- Glass quiz card -->
      <div class="mock-quiz glass">
        <div class="mock-quiz-q">Which decorator defines an Angular component?</div>
        <div class="mock-quiz-opt correct">@Component <span>✓</span></div>
        <div class="mock-quiz-opt">@Injectable</div>
        <div class="mock-progress"><div class="mock-progress-fill"></div></div>
      </div>

      <h2 class="right-title">Master Coding Through<br>Interactive Learning</h2>
      <p class="right-sub">Practice with real-world quizzes, track your progress and level up your developer skills.</p>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat glass">
          <span class="stat-num">100K+</span>
          <span class="stat-lbl">Students</span>
        </div>
        <div class="stat glass">
          <span class="stat-num">50K+</span>
          <span class="stat-lbl">Quizzes Completed</span>
        </div>
        <div class="stat glass">
          <span class="stat-num">95%</span>
          <span class="stat-lbl">Success Rate</span>
        </div>
      </div>

    </div>
  </aside>

</div>

<script>
  // Show / hide password (accessible)
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.dataset.target);
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('.eye-open').style.display = show ? 'none' : '';
      btn.querySelector('.eye-closed').style.display = show ? '' : 'none';
    });
  });

  // Loading state on submit + validation visuelle native
  var form = document.getElementById('kc-form-login');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        form.querySelectorAll('input:invalid').forEach(function (i) { i.classList.add('invalid'); });
        return;
      }
      var btn = document.getElementById('kc-login');
      btn.classList.add('loading');
      btn.disabled = true;
      // re-submit programmatique car le bouton est désactivé
      setTimeout(function () { form.submit(); }, 50);
      e.preventDefault();
    });
    form.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { i.classList.remove('invalid'); });
    });
  }
</script>

</body>
</html>
