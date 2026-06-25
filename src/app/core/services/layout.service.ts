import { Injectable, computed, effect, signal } from '@angular/core';

const COLLAPSE_KEY = 'cq-sidebar-collapsed';

/** Préfixes d'URL qui constituent « l'espace de travail » (sidebar visible). */
const WORKSPACE_PREFIXES = [
  '/dashboard', '/languages', '/results', '/certificates', '/progress',
  '/calendar', '/messages', '/notifications', '/learning', '/teacher',
  '/admin', '/preferences', '/help', '/profile',
];

/** Bascule en mode « overlay » (sidebar en tiroir) sous cette largeur. */
const COMPACT_BREAKPOINT = 1024;

/**
 * État global du shell (navbar + sidebar + tiroir notifications + palette).
 * Découplé des composants pour que top-nav / sidebar / palette partagent la
 * même source de vérité.
 *
 *  - Desktop (≥1024px) : sidebar « pousse » le contenu ; ouverture pilotée par
 *    la route (toute route de l'espace de travail l'ouvre).
 *  - Compact (<1024px) : sidebar en tiroir plein écran ; ouverture manuelle
 *    (hamburger), refermée à la sélection d'un item.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {

  readonly sidebarOpen = signal(false);
  readonly collapsed   = signal(this.readCollapsed());
  readonly compact     = signal(typeof window !== 'undefined' && window.innerWidth < COMPACT_BREAKPOINT);

  readonly paletteOpen = signal(false);
  readonly notifOpen   = signal(false);

  /** Largeur effective de la sidebar (px) — pilote le décalage du contenu. */
  readonly sidebarWidth = computed(() => {
    if (!this.sidebarOpen() || this.compact()) return 0;
    return this.collapsed() ? 80 : 280;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        const next = window.innerWidth < COMPACT_BREAKPOINT;
        if (next !== this.compact()) {
          this.compact.set(next);
          // En entrant en mode compact, on referme le tiroir pour éviter qu'il
          // s'ouvre par surprise ; en desktop, l'ouverture est repilotée par la route.
          if (next) this.sidebarOpen.set(false);
        }
      });
    }
    // Persiste l'état réduit/étendu de la sidebar.
    effect(() => {
      try {
        localStorage.setItem(COLLAPSE_KEY, this.collapsed() ? '1' : '0');
      } catch { /* stockage indisponible — on ignore */ }
    });
  }

  // ── Sidebar ───────────────────────────────────────────────────────
  openSidebar(): void { this.sidebarOpen.set(true); }
  closeSidebar(): void { this.sidebarOpen.set(false); }
  toggleSidebar(): void { this.sidebarOpen.update((v) => !v); }
  toggleCollapse(): void { this.collapsed.update((v) => !v); }

  /** Synchronise l'ouverture sur la route — uniquement en mode desktop. */
  syncRoute(isWorkspace: boolean): void {
    if (!this.compact()) this.sidebarOpen.set(isWorkspace);
  }

  isWorkspaceUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return WORKSPACE_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
  }

  // ── Palette de commandes ──────────────────────────────────────────
  openPalette(): void { this.paletteOpen.set(true); }
  closePalette(): void { this.paletteOpen.set(false); }
  togglePalette(): void { this.paletteOpen.update((v) => !v); }

  // ── Tiroir de notifications ───────────────────────────────────────
  openNotif(): void { this.notifOpen.set(true); }
  closeNotif(): void { this.notifOpen.set(false); }
  toggleNotif(): void { this.notifOpen.update((v) => !v); }

  private readCollapsed(): boolean {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; }
    catch { return false; }
  }
}
