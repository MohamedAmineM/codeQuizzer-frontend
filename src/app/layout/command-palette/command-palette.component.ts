import {
  Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { LayoutService } from '@core/services/layout.service';
import { NavigationService } from '@core/services/navigation.service';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';

interface PaletteItem {
  icon: string;
  label: string;
  group: 'Pages' | 'Actions';
  hint?: string;
  run: () => void;
}

/**
 * Palette de commandes façon Notion / Linear (Ctrl/⌘ + K). Recherche floue
 * dans les pages accessibles + actions rapides ; navigation clavier complète.
 */
@Component({
  selector: 'app-command-palette',
  imports: [],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
})
export class CommandPaletteComponent {

  readonly layout = inject(LayoutService);
  private readonly nav = inject(NavigationService);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly query = signal('');
  readonly activeIndex = signal(0);

  /** Actions rapides (le libellé du thème suit l'état courant). */
  private readonly actions = computed<PaletteItem[]>(() => [
    {
      icon: this.theme.isDark() ? 'light_mode' : 'dark_mode',
      label: this.theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode',
      group: 'Actions',
      run: () => this.theme.toggle(),
    },
    { icon: 'menu_open',     label: 'Toggle sidebar',     group: 'Actions', run: () => this.layout.toggleSidebar() },
    { icon: 'notifications', label: 'Open notifications',  group: 'Actions', run: () => this.layout.openNotif() },
    { icon: 'person',        label: 'View profile',        group: 'Actions', run: () => this.go('/profile') },
    { icon: 'logout',        label: 'Log out',             group: 'Actions', run: () => this.auth.logout() },
  ]);

  private readonly pages = computed<PaletteItem[]>(() =>
    this.nav.allPages().map((p) => ({
      icon: p.icon,
      label: p.label,
      group: 'Pages' as const,
      hint: p.route,
      run: () => this.go(p.route),
    })),
  );

  readonly results = computed<PaletteItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = [...this.pages(), ...this.actions()];
    if (!q) return all;
    return all.filter((item) => item.label.toLowerCase().includes(q));
  });

  constructor() {
    // À l'ouverture : focus du champ + réinitialisation.
    effect(() => {
      if (this.layout.paletteOpen()) {
        this.query.set('');
        this.activeIndex.set(0);
        const el = this.searchInput();
        if (el) setTimeout(() => el.nativeElement.focus(), 0);
      }
    });
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  move(delta: number): void {
    const len = this.results().length;
    if (len === 0) return;
    this.activeIndex.update((i) => (i + delta + len) % len);
  }

  selectAt(index: number): void {
    const item = this.results()[index];
    if (!item) return;
    this.layout.closePalette();
    item.run();
  }

  selectActive(): void { this.selectAt(this.activeIndex()); }

  close(): void { this.layout.closePalette(); }

  /** Raccourci global Ctrl/⌘ + K — bascule la palette (utilisateurs connectés). */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      if (!this.auth.authenticated()) return;
      event.preventDefault();
      this.layout.togglePalette();
    }
  }

  private go(route: string): void {
    void this.router.navigate([route]);
  }
}
