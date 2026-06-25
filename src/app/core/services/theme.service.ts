import { Injectable, computed, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cq-theme';

/**
 * Gère le thème clair/sombre. La palette est définie dans styles.css
 * (:root pour le clair, [data-theme="dark"] pour le sombre) — ce service
 * ne fait que basculer l'attribut data-theme sur <html> et persister le choix.
 *
 * Choix initial : préférence sauvegardée > préférence système.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly _theme = signal<Theme>(this.resolveInitial());

  /** Thème courant (lecture seule). */
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Applique le thème au DOM et le persiste à chaque changement.
    effect(() => {
      const theme = this._theme();
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      // Bootstrap 5.3 : son mode sombre natif bascule via data-bs-theme.
      // On le synchronise pour que les éléments Bootstrap (couleur de texte
      // par défaut, cartes, boutons…) suivent aussi le thème.
      root.setAttribute('data-bs-theme', theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* storage indisponible (mode privé) — on ignore, le thème reste en mémoire */
      }
    });
  }

  toggle(): void {
    this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  set(theme: Theme): void {
    this._theme.set(theme);
  }

  private resolveInitial(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
