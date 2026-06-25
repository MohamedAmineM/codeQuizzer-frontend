import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { AppRole } from '@core/auth/roles';
import { LanguageService } from '@core/i18n/language.service';

export interface NavItem {
  /** Libellé par défaut (anglais) — repli si la clé i18n est absente. */
  label: string;
  /** Clé i18n optionnelle — résolue via `label()`. */
  labelKey?: string;
  icon: string;
  route: string;
  exact?: boolean;
  /** Undefined → visible to every authenticated user. Otherwise gated by role. */
  roles?: AppRole[];
}

export interface NavSection {
  title: string;
  titleKey?: string;
  items: NavItem[];
}

/**
 * Barre de navigation supérieure — volontairement minimale (style SaaS).
 * « Dashboard » n'est pas un lien : c'est le déclencheur de la sidebar, géré
 * directement dans le composant top-nav.
 */
const TOP_NAV: NavItem[] = [
  { label: 'Home',       labelKey: 'nav.home',       icon: 'home',      route: '/',         exact: true },
  { label: 'Categories', labelKey: 'nav.categories', icon: 'grid_view', route: '/category' },
];

/**
 * Structure de la sidebar (espace de travail). Chaque item est routé ; les
 * pages pas encore construites pointent vers une page « Coming soon » dédiée.
 * Le filtrage par rôle se fait dans `sidebarSections()`.
 */
const SECTIONS: NavSection[] = [
  {
    title: 'Main',
    titleKey: 'section.main',
    items: [
      { label: 'Dashboard Overview', labelKey: 'nav.dashboardOverview', icon: 'dashboard',         route: '/dashboard',        exact: true },
      { label: 'My Languages',       labelKey: 'nav.myLanguages',       icon: 'translate',         route: '/languages',        roles: [AppRole.Student] },
      // Caché pour l'instant — { label: 'My Students', icon: 'groups', route: '/teacher/students', roles: [AppRole.Teacher] },
      { label: 'Results',            labelKey: 'nav.results',           icon: 'insights',          route: '/results',          roles: [AppRole.Student] },
      { label: 'Placement',          labelKey: 'nav.placement',         icon: 'fact_check',        route: '/learning/placement', roles: [AppRole.Student] },
      //{ label: 'Progress Analytics', icon: 'stacked_line_chart', route: '/progress',         roles: [AppRole.Student] },
      { label: 'Calendar',           labelKey: 'nav.calendar',          icon: 'calendar_month',    route: '/calendar' },
      { label: 'Notifications',      labelKey: 'nav.notifications',     icon: 'notifications',     route: '/notifications' },
      { label: 'Messages',           labelKey: 'nav.messages',          icon: 'forum',             route: '/messages' },
    ],
  },
  {
    title: 'Learning',
    titleKey: 'section.learning',
    items: [
      { label: 'Language Journey',  labelKey: 'nav.languageJourney',   icon: 'map',            route: '/learning/journey',      roles: [AppRole.Student] },
      { label: 'AI Coach',          labelKey: 'nav.aiCoach',           icon: 'smart_toy',      route: '/learning/ai-coach',     roles: [AppRole.Student] },
      { label: 'Speaking Practice', labelKey: 'nav.speakingPractice',  icon: 'mic',            route: '/learning/speaking',     roles: [AppRole.Student] },
      { label: 'Certification',     labelKey: 'nav.certification',     icon: 'workspace_premium', route: '/certificates',       roles: [AppRole.Student] },
      { label: 'Achievements',      labelKey: 'nav.achievements',      icon: 'military_tech',  route: '/learning/achievements', roles: [AppRole.Student] },
      { label: 'Language Passport', labelKey: 'nav.languagePassport',  icon: 'travel_explore', route: '/learning/passport',     roles: [AppRole.Student] },
    ],
  },
  {
    title: 'Teacher',
    titleKey: 'section.teacher',
    items: [
      // Caché pour l'instant — { label: 'Student Management', icon: 'manage_accounts', route: '/teacher/students', roles: [AppRole.Teacher] },
      { label: 'Placements',          labelKey: 'nav.placements',           icon: 'fact_check',      route: '/teacher/placements',  roles: [AppRole.Teacher] },
      { label: 'Quiz Management',      labelKey: 'nav.quizManagement',       icon: 'quiz',            route: '/teacher/quizzes',     roles: [AppRole.Teacher] },
      { label: 'Class Management',     labelKey: 'nav.classManagement',      icon: 'co_present',      route: '/teacher/classes',     roles: [AppRole.Teacher] },
      { label: 'Assignments',         labelKey: 'nav.assignments',          icon: 'assignment',      route: '/teacher/assignments', roles: [AppRole.Teacher] },
      { label: 'Student Reports',     labelKey: 'nav.studentReports',       icon: 'description',     route: '/teacher/reports',     roles: [AppRole.Teacher] },
      { label: 'Performance Analytics', labelKey: 'nav.performanceAnalytics', icon: 'analytics',     route: '/teacher/analytics',   roles: [AppRole.Teacher] },
      { label: 'Attendance Tracking', labelKey: 'nav.attendanceTracking',   icon: 'event_available', route: '/teacher/attendance',  roles: [AppRole.Teacher] },
    ],
  },
  {
    title: 'Administration',
    titleKey: 'section.administration',
    items: [
      { label: 'Activity Report', labelKey: 'nav.activityReport',  icon: 'assessment', route: '/dashboard/reports', roles: [AppRole.Admin] },
      { label: 'Users',      labelKey: 'nav.users',         icon: 'group',        route: '/admin/users',     roles: [AppRole.Admin] },
      { label: 'Teachers',   labelKey: 'nav.teachers',      icon: 'school',       route: '/admin/teachers',  roles: [AppRole.Admin] },
      { label: 'Categories', labelKey: 'nav.categoriesAdmin', icon: 'category',   route: '/admin/languages', roles: [AppRole.Admin] },
      { label: 'Levels',     labelKey: 'nav.levels',        icon: 'stairs',       route: '/admin/levels',    roles: [AppRole.Admin] },
      { label: 'Settings',   labelKey: 'nav.settings',      icon: 'settings',     route: '/admin/settings',  roles: [AppRole.Admin] },
      { label: 'Audit Logs', labelKey: 'nav.auditLogs',     icon: 'receipt_long', route: '/admin/audit',     roles: [AppRole.Admin] },
    ],
  },
];

/**
 * Navigation pilotée par les rôles Keycloak. Aucune logique de rôle dans les
 * composants : ils itèrent sur `topNav` / `sidebarSections()` et résolvent les
 * libellés traduits via `label()` / `sectionTitle()`.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {

  private readonly auth = inject(AuthService);
  private readonly i18n = inject(LanguageService);

  /** Liens fixes de la barre supérieure (hors « Dashboard »). */
  readonly topNav = TOP_NAV;

  /** Sections de la sidebar filtrées selon les rôles de l'utilisateur. */
  readonly sidebarSections = computed<NavSection[]>(() => {
    const roles = this.auth.roles();
    const visible = (item: NavItem) =>
      !item.roles || item.roles.some((r) => roles.includes(r));
    return SECTIONS
      .map((section) => ({ title: section.title, titleKey: section.titleKey, items: section.items.filter(visible) }))
      .filter((section) => section.items.length > 0);
  });

  /** Liste à plat (sans doublon) de toutes les pages accessibles — pour la palette de commandes. */
  readonly allPages = computed<NavItem[]>(() => {
    const seen = new Set<string>();
    const pages: NavItem[] = [];
    for (const item of [...this.topNav, ...this.sidebarSections().flatMap((s) => s.items)]) {
      if (!seen.has(item.route)) {
        seen.add(item.route);
        pages.push(item);
      }
    }
    return pages;
  });

  /** La cloche / le tiroir de notifications n'apparaissent que pour les connectés. */
  readonly showNotifications = computed(() => this.auth.authenticated());

  /** Libellé traduit d'un item (repli sur l'anglais si la clé est absente). */
  label(item: NavItem): string {
    if (!item.labelKey) return item.label;
    const value = this.i18n.translate(item.labelKey);
    return value === item.labelKey ? item.label : value;
  }

  /** Titre de section traduit (repli sur l'anglais si la clé est absente). */
  sectionTitle(section: NavSection): string {
    if (!section.titleKey) return section.title;
    const value = this.i18n.translate(section.titleKey);
    return value === section.titleKey ? section.title : value;
  }
}
