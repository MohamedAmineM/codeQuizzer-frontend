<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Create account — QuizCodder</title>
  <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/logo.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${url.resourcesPath}/css/custom.css">
</head>
<body>

<div class="auth-shell">

  <!-- ════════ LEFT : FORM ════════ -->
  <section class="auth-left" aria-label="Registration form">
    <div class="auth-card">

      <a class="brand" href="${url.loginUrl}" tabindex="-1">
        <img src="${url.resourcesPath}/img/logo.svg" alt="QuizCodder logo" width="44" height="44">
        <span class="brand-name">Quiz<span class="brand-accent">Codder</span></span>
      </a>

      <h1 class="auth-title">Create your account</h1>
      <p class="auth-subtitle">Start your learning journey today</p>

      <#-- Messages — erreurs de validation champ par champ, sans détail technique -->
      <#if message?has_content && message.type = 'error'>
        <div class="alert alert-error" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true"><path fill-rule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9 4a1 1 0 102 0 1 1 0 00-2 0zm1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          ${kcSanitize(message.summary)?no_esc}
        </div>
      </#if>

      <form id="kc-register-form" action="${url.registrationAction}" method="post" novalidate>

        <div class="field-grid">
          <div class="field">
            <label for="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text"
                   value="${(register.formData.firstName)!''}"
                   placeholder="Mohamed Amine"
                   autocomplete="given-name"
                   autofocus required aria-required="true">
          </div>

          <div class="field">
            <label for="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text"
                   value="${(register.formData.lastName)!''}"
                   placeholder="Mnassri"
                   autocomplete="family-name"
                   required aria-required="true">
          </div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email"
                 value="${(register.formData.email)!''}"
                 placeholder="you@example.com"
                 autocomplete="email"
                 required aria-required="true">
        </div>

        <#if !realm.registrationEmailAsUsername>
          <div class="field">
            <label for="username">Username</label>
            <input id="username" name="username" type="text"
                   value="${(register.formData.username)!''}"
                   placeholder="mohamed.dev"
                   autocomplete="username"
                   required aria-required="true">
          </div>
        </#if>

        <#if passwordRequired??>
          <div class="field">
            <label for="password">Password</label>
            <div class="password-wrap">
              <input id="password" name="password" type="password"
                     placeholder="8+ characters"
                     autocomplete="new-password"
                     minlength="8"
                     required aria-required="true"
                     aria-describedby="password-hint">
              <button type="button" class="toggle-password" data-target="password"
                      aria-label="Show password" aria-pressed="false">
                <svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg class="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="display:none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 19c-6.5 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <small id="password-hint" class="hint">Use at least 8 characters with letters and numbers.</small>
          </div>

          <div class="field">
            <label for="password-confirm">Confirm Password</label>
            <div class="password-wrap">
              <input id="password-confirm" name="password-confirm" type="password"
                     placeholder="••••••••"
                     autocomplete="new-password"
                     required aria-required="true">
              <button type="button" class="toggle-password" data-target="password-confirm"
                      aria-label="Show password" aria-pressed="false">
                <svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg class="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="display:none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 19c-6.5 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <small class="hint error-hint" id="confirm-error" hidden>Passwords do not match.</small>
          </div>
        </#if>

        <#if recaptchaRequired??>
          <div class="field">
            <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
          </div>
        </#if>

        <button type="submit" class="btn-primary" id="kc-register">
          <span class="btn-label">Create Account</span>
          <span class="btn-spinner" aria-hidden="true"></span>
        </button>

      </form>

      <p class="bottom-text">
        Already have an account?
        <a class="link" href="${url.loginUrl}">Sign In</a>
      </p>

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
      <div class="mock-window">
        <div class="mock-titlebar"><span></span><span></span><span></span></div>
        <pre class="mock-code"><code><span class="c-key">const</span> <span class="c-var">dev</span> = <span class="c-key">new</span> <span class="c-fn">Developer</span>(<span class="c-str">'you'</span>);

dev.<span class="c-fn">learn</span>(<span class="c-str">'Java'</span>, <span class="c-str">'Angular'</span>, <span class="c-str">'SQL'</span>)
   .<span class="c-fn">practice</span>()
   .<span class="c-fn">levelUp</span>(); <span class="c-cmt">// 🚀</span></code></pre>
      </div>

      <div class="mock-quiz glass">
        <div class="mock-quiz-q">Join thousands of developers improving daily</div>
        <div class="mock-progress"><div class="mock-progress-fill"></div></div>
      </div>

      <h2 class="right-title">Master Coding Through<br>Interactive Learning</h2>
      <p class="right-sub">Create a free account and start practicing with interactive quizzes built by developers, for developers.</p>

      <div class="stats-row">
        <div class="stat glass"><span class="stat-num">100K+</span><span class="stat-lbl">Students</span></div>
        <div class="stat glass"><span class="stat-num">50K+</span><span class="stat-lbl">Quizzes Completed</span></div>
        <div class="stat glass"><span class="stat-num">95%</span><span class="stat-lbl">Success Rate</span></div>
      </div>
    </div>
  </aside>

</div>

<script>
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

  var form = document.getElementById('kc-register-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      var pwd = document.getElementById('password');
      var confirm = document.getElementById('password-confirm');
      var confirmError = document.getElementById('confirm-error');

      // Vérification locale de la confirmation (la validation finale reste côté Keycloak)
      if (pwd && confirm && pwd.value !== confirm.value) {
        e.preventDefault();
        confirm.classList.add('invalid');
        if (confirmError) confirmError.hidden = false;
        return;
      }
      if (!form.checkValidity()) {
        e.preventDefault();
        form.querySelectorAll('input:invalid').forEach(function (i) { i.classList.add('invalid'); });
        return;
      }
      var btn = document.getElementById('kc-register');
      btn.classList.add('loading');
      btn.disabled = true;
      setTimeout(function () { form.submit(); }, 50);
      e.preventDefault();
    });
    form.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () {
        i.classList.remove('invalid');
        var confirmError = document.getElementById('confirm-error');
        if (confirmError) confirmError.hidden = true;
      });
    });
  }
</script>

</body>
</html>
