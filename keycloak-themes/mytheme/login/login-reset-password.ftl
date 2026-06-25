<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Reset password — QuizCodder</title>
  <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/logo.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${url.resourcesPath}/css/custom.css">
</head>
<body>

<div class="auth-shell auth-centered">

  <section class="auth-left" aria-label="Reset password form">
    <div class="auth-card">

      <a class="brand" href="${url.loginUrl}" tabindex="-1">
        <img src="${url.resourcesPath}/img/logo.svg" alt="QuizCodder logo" width="44" height="44">
        <span class="brand-name">Quiz<span class="brand-accent">Codder</span></span>
      </a>

      <h1 class="auth-title">Reset your password</h1>
      <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>

      <#if message?has_content>
        <#if message.type = 'error'>
          <div class="alert alert-error" role="alert">Invalid email address</div>
        <#else>
          <div class="alert alert-success" role="status">${kcSanitize(message.summary)?no_esc}</div>
        </#if>
      </#if>

      <form id="kc-reset-password-form" action="${url.loginAction}" method="post" novalidate>
        <div class="field">
          <label for="username">Email</label>
          <input id="username" name="username" type="email"
                 value="${(auth.attemptedUsername)!''}"
                 placeholder="you@example.com"
                 autocomplete="username"
                 autofocus required aria-required="true">
        </div>

        <button type="submit" class="btn-primary">
          <span class="btn-label">Send Reset Link</span>
          <span class="btn-spinner" aria-hidden="true"></span>
        </button>
      </form>

      <p class="bottom-text">
        <a class="link" href="${url.loginUrl}">&larr; Back to Sign In</a>
      </p>

    </div>
  </section>

</div>

</body>
</html>
