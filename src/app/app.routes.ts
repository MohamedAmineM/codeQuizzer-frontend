import { Routes } from '@angular/router';
import { canActivateAuthRole } from '@core/guards/auth-role.guard';
import { firstLoginGuard } from '@core/guards/first-login.guard';
import { AppRole } from '@core/auth/roles';
import { HomeComponent } from '@features/home/home.component';

// Toutes les pages « Coming soon » partagent le même composant ; seul le
// `data` (feature/icon/blurb) change. Chargé une fois, réutilisé partout.
const comingSoon = () =>
  import('@features/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent);

// La page d'accueil reste chargée en eager (premier rendu le plus rapide) ;
// toutes les autres pages sont lazy-loadées pour réduire le bundle initial.
export const routes: Routes = [

  // ── Public ────────────────────────────────────────────────────────
  { path: '', component: HomeComponent, title: 'Accueil · CodeQuizzer' },
  {
    path: 'about',
    title: 'À propos · CodeQuizzer',
    loadComponent: () => import('@features/about/about.component').then((m) => m.AboutComponent)
  },
  {
    path: 'contact',
    title: 'Contact · CodeQuizzer',
    loadComponent: () => import('@features/contact/contact.component').then((m) => m.ContactComponent)
  },

  // ── Quiz (authentification requise) ──────────────────────────────
  {
    path: 'category',
    title: 'Catégories · CodeQuizzer',
    loadComponent: () => import('@features/categories/category.component').then((m) => m.CategoryComponent),
    canActivate: [canActivateAuthRole]
  },
  {
    path: 'quizs',
    title: 'Quiz · CodeQuizzer',
    loadComponent: () => import('@features/quiz/quiz-page/quiz-page.component').then((m) => m.QuizPageComponent),
    canActivate: [canActivateAuthRole]
  },
  {
    path: 'result',
    title: 'Résultat · CodeQuizzer',
    loadComponent: () => import('@features/quiz/result-page/result-page.component').then((m) => m.ResultPageComponent),
    canActivate: [canActivateAuthRole]
  },

  // ── Étudiant ──────────────────────────────────────────────────────
  {
    path: 'results',
    title: 'Mes résultats · CodeQuizzer',
    loadComponent: () => import('@features/results/results-page/results-page.component').then((m) => m.ResultsPageComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Student] }
  },

  // ── Langues (inscription + suivi) ─────────────────────────────────
  {
    path: 'languages/enroll',
    title: 'Choisir mes langues · CodeQuizzer',
    loadComponent: () => import('@features/languages/enroll/language-enroll.component').then((m) => m.LanguageEnrollComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Student] }
  },
  {
    path: 'languages',
    title: 'My Languages · CodeQuizzer',
    loadComponent: () => import('@features/languages/my-languages/my-languages.component').then((m) => m.MyLanguagesComponent),
    canActivate: [canActivateAuthRole, firstLoginGuard],
    data: { roles: [AppRole.Student] }
  },

  // ── Notifications (tous les connectés) ────────────────────────────
  {
    path: 'notifications',
    title: 'Notifications · CodeQuizzer',
    loadComponent: () => import('@features/notifications/notifications-page/notifications-page.component').then((m) => m.NotificationsPageComponent),
    canActivate: [canActivateAuthRole]
  },
  {
    path: 'notifications/:id',
    title: 'Notification · CodeQuizzer',
    loadComponent: () => import('@features/notifications/notification-detail/notification-detail.component').then((m) => m.NotificationDetailComponent),
    canActivate: [canActivateAuthRole]
  },

  // ── Enseignant ────────────────────────────────────────────────────
  {
    path: 'teacher/dashboard',
    title: 'Teacher Dashboard · CodeQuizzer',
    loadComponent: () => import('@features/teacher/dashboard/teacher-dashboard.component').then((m) => m.TeacherDashboardComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Teacher] }
  },
  {
    path: 'teacher/quizzes',
    title: 'Quiz Management · CodeQuizzer',
    loadComponent: () => import('@features/teacher/quizzes/teacher-quizzes.component').then((m) => m.TeacherQuizzesComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Teacher] }
  },
  {
    path: 'teacher/students',
    title: 'My Students · CodeQuizzer',
    loadComponent: () => import('@features/teacher/students/teacher-students.component').then((m) => m.TeacherStudentsComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Teacher] }
  },
  { path: 'teacher', redirectTo: 'teacher/dashboard', pathMatch: 'full' },

  // ── Administration ────────────────────────────────────────────────
  {
    path: 'admin/dashboard',
    title: 'Admin Dashboard · CodeQuizzer',
    loadComponent: () => import('@features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Admin] }
  },
  {
    path: 'admin/users',
    title: 'User Management · CodeQuizzer',
    loadComponent: () => import('@features/admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Admin] }
  },
  {
    path: 'admin/languages',
    title: 'Category Management · CodeQuizzer',
    loadComponent: () => import('@features/admin/languages/admin-languages.component').then((m) => m.AdminLanguagesComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Admin] }
  },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // ── Executive Activity Report (Phase 5, ADMIN only) ───────────────
  {
    path: 'dashboard/reports',
    title: 'Activity Report · CodeQuizzer',
    loadComponent: () => import('@features/admin/reports/activity-report.component').then((m) => m.ActivityReportComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Admin] }
  },

  // ── Compte & divers ───────────────────────────────────────────────
  {
    path: 'profile',
    title: 'Mon profil · CodeQuizzer',
    loadComponent: () => import('@features/profile/user-profile.component').then((m) => m.UserProfileComponent),
    canActivate: [canActivateAuthRole]
  },
  {
    path: 'forbidden',
    title: 'Accès refusé · CodeQuizzer',
    loadComponent: () => import('@features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent)
  },

  // ── Espace de travail (sidebar) ───────────────────────────────────
  {
    path: 'dashboard',
    title: 'Dashboard · CodeQuizzer',
    loadComponent: () => import('@features/dashboard/dashboard-home.component').then((m) => m.DashboardHomeComponent),
    canActivate: [canActivateAuthRole],
  },

  // Pages « Main » / transverses (tous les connectés)
  {
    path: 'calendar',
    title: 'Calendar · CodeQuizzer',
    loadComponent: () => import('@features/calendar/calendar-page.component').then((m) => m.CalendarPageComponent),
    canActivate: [canActivateAuthRole],
  },
  { path: 'messages', title: 'Messages · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole],
    data: { feature: 'Messages', icon: 'forum', blurb: 'Chat with teachers and classmates without leaving your workspace.' } },
  { path: 'help', title: 'Help Center · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole],
    data: { feature: 'Help Center', icon: 'help_center', blurb: 'Guides, FAQs and support — answers when you need them.' } },
  { path: 'preferences/language', title: 'Language Preferences · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole],
    data: { feature: 'Language Preferences', icon: 'translate', blurb: 'Choose your interface language and learning preferences.' } },

  // Étudiant
  { path: 'certificates', title: 'Certificates · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Certificates', icon: 'workspace_premium', blurb: 'Earn and download certificates as you complete each CEFR level.' } },
  //{ path: 'progress', title: 'Progress Analytics · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Progress Analytics', icon: 'stacked_line_chart', blurb: 'Track your scores, streaks and level progression over time.' } },
  { path: 'learning/journey', title: 'Language Journey · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Language Journey', icon: 'map', blurb: 'A guided path from A1 to C2, one milestone at a time.' } },
  { path: 'learning/ai-coach', title: 'AI Coach · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'AI Coach', icon: 'smart_toy', blurb: 'A personal AI tutor that adapts practice to your weak spots.' } },
  { path: 'learning/speaking', title: 'Speaking Practice · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Speaking Practice', icon: 'mic', blurb: 'Practice pronunciation and conversation with instant feedback.' } },
  {
    path: 'learning/placement',
    title: 'Placement Test · CodeQuizzer',
    loadComponent: () => import('@features/placement/placement-home.component').then((m) => m.PlacementHomeComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Student] },
  },
  {
    path: 'learning/placement/result',
    title: 'Placement Result · CodeQuizzer',
    loadComponent: () => import('@features/placement/placement-result.component').then((m) => m.PlacementResultComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Student] },
  },
  { path: 'learning/achievements', title: 'Achievements · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Achievements', icon: 'military_tech', blurb: 'Unlock badges and rewards as you hit learning milestones.' } },
  { path: 'learning/passport', title: 'Language Passport · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Student], feature: 'Language Passport', icon: 'travel_explore', blurb: 'A portable record of every language and level you’ve mastered.' } },

  // Enseignant
  { path: 'teacher/classes', title: 'Class Management · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Teacher], feature: 'Class Management', icon: 'co_present', blurb: 'Organise students into classes and manage them in one place.' } },
  { path: 'teacher/assignments', title: 'Assignments · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Teacher], feature: 'Assignments', icon: 'assignment', blurb: 'Create, distribute and grade assignments for your students.' } },
  { path: 'teacher/reports', title: 'Student Reports · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Teacher], feature: 'Student Reports', icon: 'description', blurb: 'Generate detailed performance reports per student or class.' } },
  { path: 'teacher/analytics', title: 'Performance Analytics · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Teacher], feature: 'Performance Analytics', icon: 'analytics', blurb: 'Visualise class trends, pass rates and engagement at a glance.' } },
  { path: 'teacher/attendance', title: 'Attendance Tracking · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Teacher], feature: 'Attendance Tracking', icon: 'event_available', blurb: 'Record and review attendance across your sessions.' } },
  {
    path: 'teacher/placements',
    title: 'Placements · CodeQuizzer',
    loadComponent: () => import('@features/placement/teacher/placement-list.component').then((m) => m.PlacementListComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Teacher] },
  },
  {
    path: 'teacher/placements/:id',
    title: 'Placement Report · CodeQuizzer',
    loadComponent: () => import('@features/placement/teacher/placement-detail.component').then((m) => m.PlacementDetailComponent),
    canActivate: [canActivateAuthRole],
    data: { roles: [AppRole.Teacher] },
  },

  // Administration
  { path: 'admin/teachers', title: 'Teacher Operations Center · CodeQuizzer',
    loadComponent: () => import('@features/admin/teachers/teacher-ops.component').then((m) => m.TeacherOpsComponent),
    canActivate: [canActivateAuthRole], data: { roles: [AppRole.Admin] } },
  { path: 'admin/levels', title: 'Levels · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Admin], feature: 'Levels', icon: 'stairs', blurb: 'Configure CEFR levels and their progression thresholds.' } },
  { path: 'admin/settings', title: 'Settings · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Admin], feature: 'Settings', icon: 'settings', blurb: 'Platform-wide configuration and administrative options.' } },
  { path: 'admin/audit', title: 'Audit Logs · CodeQuizzer', loadComponent: comingSoon, canActivate: [canActivateAuthRole], data: { roles: [AppRole.Admin], feature: 'Audit Logs', icon: 'receipt_long', blurb: 'A complete, searchable trail of actions across the platform.' } },

  { path: '**', redirectTo: '' },
];
