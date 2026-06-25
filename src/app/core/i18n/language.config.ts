/**
 * ──────────────────────────────────────────────────────────────────────────
 *  CATALOGUE DES LANGUES — point d'extension unique de l'i18n
 * ──────────────────────────────────────────────────────────────────────────
 *  Ajouter une langue = ajouter UNE entrée ici + le fichier
 *  `src/assets/i18n/<code>.json` correspondant. Aucun composant n'a besoin
 *  d'être modifié (drapeau, sens d'écriture et noms sont portés par l'entrée).
 *
 *  Les drapeaux sont des SVG inline (et non des emojis 🇬🇧) : les emojis de
 *  drapeau ne s'affichent pas sous Windows/Chrome (ils tombent en « GB »,
 *  « FR »…). Le SVG garantit un rendu net et identique sur toutes les
 *  plateformes — exigence d'un composant SaaS premium.
 */
export type TextDirection = 'ltr' | 'rtl';

export interface AppLanguage {
  /** Code ISO 639-1 — sert de clé localStorage, de nom de fichier i18n et d'attribut <html lang>. */
  readonly code: string;
  /** Libellé court affiché dans la pilule de la navbar (EN / FR / AR). */
  readonly short: string;
  /** Nom natif présenté dans la liste déroulante (English / Français / العربية). */
  readonly nativeName: string;
  /** Nom anglais — utile pour les libellés ARIA / les outils. */
  readonly englishName: string;
  /** Sens d'écriture — pilote dir="ltr|rtl" sur <html>. */
  readonly dir: TextDirection;
  /** Drapeau SVG inline (ratio ~3:2, coins arrondis). */
  readonly flag: string;
}

/** Clé de persistance demandée par la spec — valeurs : en | fr | ar. */
export const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/** Langue par défaut si aucune préférence n'est détectée. */
export const DEFAULT_LANGUAGE_CODE = 'en';

// ── Drapeaux SVG (ids de clip uniques pour éviter toute collision) ──────────
const FLAG_GB = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs><clipPath id="flag-gb"><rect width="60" height="40" rx="6"/></clipPath></defs>
  <g clip-path="url(#flag-gb)">
    <rect width="60" height="40" fill="#012169"/>
    <path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="8"/>
    <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" stroke-width="4"/>
    <path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/>
    <path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="6"/>
  </g>
</svg>`;

const FLAG_FR = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs><clipPath id="flag-fr"><rect width="60" height="40" rx="6"/></clipPath></defs>
  <g clip-path="url(#flag-fr)">
    <rect width="60" height="40" fill="#fff"/>
    <rect width="20" height="40" fill="#0055A4"/>
    <rect x="40" width="20" height="40" fill="#EF4135"/>
  </g>
</svg>`;

const FLAG_SA = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs><clipPath id="flag-sa"><rect width="60" height="40" rx="6"/></clipPath></defs>
  <g clip-path="url(#flag-sa)">
    <rect width="60" height="40" fill="#1A7A3D"/>
    <path d="M13 16 q3 -4 6 0 t6 0 t6 0 t6 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="13" y="25" width="34" height="2.6" rx="1.3" fill="#fff"/>
    <path d="M47 26.3 l-4 -2.2 v4.4 z" fill="#fff"/>
  </g>
</svg>`;

/**
 * Langues supportées. L'ordre est celui d'affichage dans le menu.
 */
export const LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', short: 'EN', nativeName: 'English',  englishName: 'English', dir: 'ltr', flag: FLAG_GB },
  { code: 'fr', short: 'FR', nativeName: 'Français', englishName: 'French',  dir: 'ltr', flag: FLAG_FR },
  { code: 'ar', short: 'AR', nativeName: 'العربية',  englishName: 'Arabic',  dir: 'rtl', flag: FLAG_SA },
];

/** Retourne la langue correspondant au code, ou `undefined` si non supportée. */
export function findLanguage(code: string | null | undefined): AppLanguage | undefined {
  if (!code) return undefined;
  const normalized = code.toLowerCase().split('-')[0];
  return LANGUAGES.find((l) => l.code === normalized);
}
