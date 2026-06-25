import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

/**
 * Pipe de traduction : `{{ 'nav.home' | t }}` ou `{{ 'greeting' | t:{ name } }}`.
 *
 *  Impur À DESSEIN : il relit le dictionnaire actif (un signal) à chaque cycle
 *  de détection de changement. Quand la langue bascule, le signal change, la
 *  détection se déclenche et toutes les traductions se mettent à jour
 *  instantanément — sans rechargement. Le coût est négligeable (lookup O(1)
 *  sur un objet plat).
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {

  private readonly i18n = inject(LanguageService);

  transform(key: string | null | undefined, params?: Record<string, string | number>): string {
    if (!key) return '';
    return this.i18n.translate(key, params);
  }
}
