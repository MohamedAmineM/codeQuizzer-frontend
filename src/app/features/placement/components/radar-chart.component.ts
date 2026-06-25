import { Component, computed, input } from '@angular/core';

export interface RadarAxis { label: string; value: number; } // value 0..100

interface Geometry {
  rings: string[];
  spokes: { x1: number; y1: number; x2: number; y2: number }[];
  labels: { x: number; y: number; anchor: string; baseline: string; label: string }[];
  dataPoints: string;
  dots: { x: number; y: number; value: number; lx: number; ly: number }[];
  cx: number;
  cy: number;
}

/**
 * Radar (toile d'araignée) en SVG pur — sans dépendance, thémé via les tokens
 * CSS (s'adapte donc au mode sombre). Affiche N axes (ici les 5 compétences).
 */
@Component({
  selector: 'app-radar-chart',
  imports: [],
  template: `
    <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()" class="radar" role="img"
         [attr.aria-label]="'Skill radar chart'">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--primary)" stop-opacity="0.35" />
          <stop offset="1" stop-color="var(--secondary)" stop-opacity="0.30" />
        </linearGradient>
      </defs>

      <!-- grille -->
      @for (ring of geo().rings; track $index) {
        <polygon [attr.points]="ring" class="radar-ring" />
      }
      @for (s of geo().spokes; track $index) {
        <line [attr.x1]="s.x1" [attr.y1]="s.y1" [attr.x2]="s.x2" [attr.y2]="s.y2" class="radar-spoke" />
      }

      <!-- aire de données -->
      <polygon [attr.points]="geo().dataPoints" class="radar-area" />

      <!-- points -->
      @for (d of geo().dots; track $index) {
        <circle [attr.cx]="d.x" [attr.cy]="d.y" r="4" class="radar-dot" />
        <text [attr.x]="d.lx" [attr.y]="d.ly" class="radar-value">{{ d.value }}</text>
      }

      <!-- libellés des axes -->
      @for (l of geo().labels; track $index) {
        <text [attr.x]="l.x" [attr.y]="l.y" [attr.text-anchor]="l.anchor"
              [attr.dominant-baseline]="l.baseline" class="radar-label">{{ l.label }}</text>
      }
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .radar { width: 100%; height: auto; overflow: visible; }
    .radar-ring { fill: none; stroke: var(--border); stroke-width: 1; }
    .radar-spoke { stroke: var(--border); stroke-width: 1; }
    .radar-area { fill: url(#radarFill); stroke: var(--primary); stroke-width: 2.5; stroke-linejoin: round;
      filter: drop-shadow(0 4px 10px rgba(37, 99, 235, 0.25)); }
    .radar-dot { fill: var(--surface); stroke: var(--primary); stroke-width: 2.5; }
    .radar-value { fill: var(--primary); font-size: 11px; font-weight: 800; text-anchor: middle; }
    .radar-label { fill: var(--text-muted); font-size: 12px; font-weight: 700; }
  `],
})
export class RadarChartComponent {
  readonly axes = input.required<RadarAxis[]>();
  readonly size = input(300);

  readonly geo = computed<Geometry>(() => {
    const axes = this.axes();
    const n = axes.length;
    const s = this.size();
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.34;

    const pt = (i: number, ratio: number) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return { x: cx + r * ratio * Math.cos(a), y: cy + r * ratio * Math.sin(a), a };
    };

    const rings = [0.25, 0.5, 0.75, 1].map((ratio) =>
      axes.map((_, i) => { const p = pt(i, ratio); return `${p.x},${p.y}`; }).join(' '),
    );

    const spokes = axes.map((_, i) => {
      const p = pt(i, 1);
      return { x1: cx, y1: cy, x2: p.x, y2: p.y };
    });

    const labels = axes.map((ax, i) => {
      const p = pt(i, 1.22);
      const cos = Math.cos(p.a);
      const sin = Math.sin(p.a);
      const anchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';
      const baseline = sin > 0.25 ? 'hanging' : sin < -0.25 ? 'auto' : 'middle';
      return { x: p.x, y: p.y, anchor, baseline, label: ax.label };
    });

    const dataPts = axes.map((ax, i) => { const p = pt(i, ax.value / 100); return `${p.x},${p.y}`; });
    const dots = axes.map((ax, i) => {
      const p = pt(i, ax.value / 100);
      const lp = pt(i, ax.value / 100 + 0.12);
      return { x: p.x, y: p.y, value: ax.value, lx: lp.x, ly: lp.y };
    });

    return { rings, spokes, labels, dataPoints: dataPts.join(' '), dots, cx, cy };
  });
}
