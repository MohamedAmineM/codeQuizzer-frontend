import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Page « Coming soon » réutilisable pour les entrées de sidebar dont la
 * fonctionnalité n'est pas encore construite. Le titre / l'icône / le texte
 * proviennent du `data` de la route, donc une seule route + un `data` suffisent
 * pour brancher une nouvelle page placeholder.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.css',
})
export class ComingSoonComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: {} as Record<string, unknown> });

  readonly feature = computed(() => (this.data()['feature'] as string) ?? 'This feature');
  readonly icon = computed(() => (this.data()['icon'] as string) ?? 'construction');
  readonly blurb = computed(
    () => (this.data()['blurb'] as string)
      ?? 'We’re building this experience. It will appear right here once it’s ready.',
  );
}
