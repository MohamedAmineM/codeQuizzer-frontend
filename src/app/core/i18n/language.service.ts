import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AppLanguage,
  DEFAULT_LANGUAGE_CODE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  TextDirection,
  findLanguage,
} from './language.config';

type Dictionary = Record<string, string>;

/**
 * Service d'internationalisation — 100 % signaux, sans dépendance externe.
 *
 *  • L'état (langue courante + dictionnaire actif) vit dans des signaux : tout
 *    changement se propage instantanément au template via le pipe `t`, sans
 *    rechargement de page.
 *  • Le sens d'écriture (`dir`) et l'attribut `lang` sont appliqués sur <html>
 *    immédiatement → bascule LTR/RTL instantanée.
 *  • La préférence est persistée dans localStorage sous `preferredLanguage`.
 *  • Les dictionnaires sont chargés depuis `src/assets/i18n/<code>.json` via un
 *    HttpClient ISOLÉ (HttpBackend) : il court-circuite les intercepteurs
 *    Keycloak/erreur — un asset statique ne porte pas de token et un 404
 *    éventuel ne doit pas déclencher de toast d'erreur global.
 *
 *  Le même pattern que ThemeService (signal + effect-like + DOM + storage).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

  /** HttpClient isolé (sans intercepteurs) pour les assets de traduction. */
  private readonly http = new HttpClient(inject(HttpBackend));

  /** Cache des dictionnaires déjà chargés — un fetch par langue, max. */
  private readonly cache = new Map<string, Dictionary>();

  private readonly _current = signal<AppLanguage>(this.resolveInitial());
  private readonly _dict = signal<Dictionary>({});

  /** Liste des langues disponibles (pour le sélecteur). */
  readonly languages = LANGUAGES;

  /** Langue courante (lecture seule). */
  readonly current = this._current.asReadonly();
  /** Dictionnaire actif (lecture seule) — lu par le pipe `t`. */
  readonly dict = this._dict.asReadonly();

  readonly code = computed<string>(() => this._current().code);
  readonly dir = computed<TextDirection>(() => this._current().dir);
  readonly isRtl = computed<boolean>(() => this._current().dir === 'rtl');

  /**
   * Initialisation (appelée par provideAppInitializer) : applique le DOM et
   * charge le dictionnaire de la langue initiale AVANT le premier rendu, afin
   * d'éviter tout « flash » de clés brutes. Les autres langues sont préchargées
   * en arrière-plan pour que la première bascule soit elle aussi instantanée.
   */
  async init(): Promise<void> {
    this.applyToDom(this._current());
    await this.load(this._current().code);
    void this.prefetchOthers();
  }

  /**
   * Bascule de langue — instantanée et sans rechargement.
   * `dir`/`lang`/persistance sont appliqués tout de suite ; le dictionnaire
   * suit immédiatement s'il est en cache, sinon après un court fetch.
   */
  use(code: string): void {
    const lang = findLanguage(code) ?? this._current();
    if (lang.code === this._current().code && Object.keys(this._dict()).length > 0) {
      return;
    }
    this._current.set(lang);
    this.applyToDom(lang);
    this.persist(lang.code);

    const cached = this.cache.get(lang.code);
    if (cached) {
      this._dict.set(cached);
    } else {
      void this.load(lang.code);
    }
  }

  /**
   * Traduit une clé selon le dictionnaire actif. Les paramètres `{{name}}`
   * sont interpolés. Clé absente → la clé est renvoyée telle quelle (visible
   * en dev, jamais de blanc en prod).
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const raw = this._dict()[key];
    if (raw == null) return key;
    if (!params) return raw;
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) =>
      params[name] != null ? String(params[name]) : `{{${name}}}`,
    );
  }

  // ── Interne ───────────────────────────────────────────────────────────────

  /** Charge (et met en cache) le dictionnaire d'une langue puis l'active. */
  private async load(code: string): Promise<void> {
    try {
      const dict = await firstValueFrom(
        this.http.get<Dictionary>(`assets/i18n/${code}.json`),
      );
      this.cache.set(code, dict);
      // N'active le dictionnaire que s'il correspond toujours à la langue courante
      // (garde contre les bascules rapides successives).
      if (this._current().code === code) {
        this._dict.set(dict);
      }
    } catch {
      console.warn(`[i18n] dictionnaire introuvable pour « ${code} » — clés affichées en repli.`);
      if (this._current().code === code) this._dict.set({});
    }
  }

  /** Précharge en arrière-plan les langues non actives (cache chaud). */
  private async prefetchOthers(): Promise<void> {
    const active = this._current().code;
    await Promise.all(
      LANGUAGES.filter((l) => l.code !== active && !this.cache.has(l.code)).map(async (l) => {
        try {
          const dict = await firstValueFrom(this.http.get<Dictionary>(`assets/i18n/${l.code}.json`));
          this.cache.set(l.code, dict);
        } catch {
          /* préchargement best-effort — on ignore les échecs */
        }
      }),
    );
  }

  /** Applique langue + sens d'écriture sur <html> (bascule LTR/RTL immédiate). */
  private applyToDom(lang: AppLanguage): void {
    const root = document.documentElement;
    root.setAttribute('lang', lang.code);
    root.setAttribute('dir', lang.dir);
  }

  private persist(code: string): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* stockage indisponible (mode privé) — la langue reste en mémoire */
    }
  }

  /** Préférence sauvegardée > langue du navigateur > défaut. */
  private resolveInitial(): AppLanguage {
    try {
      const saved = findLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    const browser = findLanguage(typeof navigator !== 'undefined' ? navigator.language : null);
    return browser ?? findLanguage(DEFAULT_LANGUAGE_CODE)!;
  }
}
