import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ResultService } from '../services/result.service';

/**
 * Page « Mes résultats » (étudiant).
 *
 * Ce composant ne contient AUCUNE logique métier ni appel HTTP : toutes les
 * données viennent des signaux de ResultService (voir ce fichier pour le
 * mapping complet vers les microservices). Quand le backend sera branché,
 * ce composant ne change pas d'une ligne.
 *
 * Sections du template → source de données :
 *  - KPIs (quiz complétés, taux, meilleur score) → ASSESSMENT SERVICE (via results.history / stats)
 *  - Graphique de progression                    → ASSESSMENT SERVICE (chartEntries ci-dessous)
 *  - Performance par catégorie                   → ASSESSMENT SERVICE + QUIZ SERVICE (couleurs)
 *  - Quiz History (table)                        → ASSESSMENT SERVICE (results.history)
 *  - Leaderboard                                 → ASSESSMENT SERVICE (agrégat cross-utilisateurs)
 */
@Component({
  selector: 'app-results-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './results-page.component.html',
  styleUrl: './results-page.component.css'
})
export class ResultsPageComponent {

  readonly results = inject(ResultService);

  /**
   * 🧮 Présentation uniquement — historique inversé (ancien → récent) pour
   * que le graphique se lise de gauche à droite. La donnée brute vient de
   * l'ASSESSMENT SERVICE (results.history). Si l'API renvoie déjà trié
   * chronologiquement (?sort=completedAt,asc), ce computed devient inutile.
   */
  readonly chartEntries = computed(() => [...this.results.history()].reverse());

  /**
   * 🎨 Présentation uniquement — seuils de couleur des scores (vert ≥ 80,
   * orange ≥ 60, rouge sinon). Reste côté frontend : c'est de l'affichage,
   * pas une règle métier du backend.
   */
  scoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-mid';
    return 'score-low';
  }
}
