import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { LanguageService } from '@core/i18n/language.service';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { AppLanguage, LANGUAGES } from '@core/i18n/language.config';

/**
 * Sélecteur de langue premium pour la navbar.
 *
 *  • Pilule « 🌐 EN ▾ » → menu flottant (glassmorphism) listant English /
 *    Français / العربية ; la langue courante est surlignée + cochée.
 *  • Bascule instantanée (signaux), persistée, sans rechargement — toute la
 *    logique d'i18n vit dans LanguageService.
 *  • Accessibilité : pattern listbox ARIA, navigation clavier (↑/↓/Home/End),
 *    Entrée/Espace pour sélectionner, Échap + clic extérieur pour fermer, focus
 *    rendu au déclencheur à la fermeture.
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent {

  readonly i18n = inject(LanguageService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly languages = LANGUAGES;
  readonly current = this.i18n.current;

  readonly open = signal(false);
  /** Option « active » au clavier (descendant ARIA actif). */
  readonly focusedIndex = signal(0);

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLUListElement>>('menu');

  /** Drapeaux SVG pré-assainis (statiques et de confiance). */
  private readonly flags: Record<string, SafeHtml> = Object.fromEntries(
    LANGUAGES.map((l) => [l.code, this.sanitizer.bypassSecurityTrustHtml(l.flag)]),
  );

  constructor() {
    // À l'ouverture, on déplace le focus dans la liste (pattern listbox).
    effect(() => {
      if (this.open()) this.menu()?.nativeElement.focus();
    });
  }

  flagFor(code: string): SafeHtml {
    return this.flags[code];
  }

  /** Libellé ARIA du déclencheur (« Changer de langue — English »). */
  triggerAriaLabel(): string {
    return `${this.i18n.translate('lang.switcher.label')} — ${this.current().englishName}`;
  }

  optionId(index: number): string {
    return `lang-opt-${index}`;
  }

  isActive(lang: AppLanguage): boolean {
    return lang.code === this.current().code;
  }

  toggle(): void {
    this.open() ? this.close() : this.openMenu();
  }

  openMenu(): void {
    const idx = this.languages.findIndex((l) => l.code === this.current().code);
    this.focusedIndex.set(idx < 0 ? 0 : idx);
    this.open.set(true);
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.trigger().nativeElement.focus();
  }

  select(lang: AppLanguage): void {
    this.i18n.use(lang.code);
    this.close();
  }

  // ── Clavier ─────────────────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.open()) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          this.close();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.move(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.move(-1);
          break;
        case 'Home':
          event.preventDefault();
          this.focusedIndex.set(0);
          break;
        case 'End':
          event.preventDefault();
          this.focusedIndex.set(this.languages.length - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.select(this.languages[this.focusedIndex()]);
          break;
        case 'Tab':
          this.close(false);
          break;
      }
    } else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openMenu();
    }
  }

  private move(delta: number): void {
    const n = this.languages.length;
    this.focusedIndex.update((i) => (i + delta + n) % n);
  }

  // ── Clic extérieur ──────────────────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node | null)) {
      this.close(false);
    }
  }
}
