import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { AnalyticsService } from './analytics.service';
import { ThemeService } from '@core/services/theme.service';
import { ChartData, LanguageStatus, NameValue, PERIOD_OPTIONS, PeriodKey } from './analytics.model';

// Brand palette (mirrors styles.css tokens) — ECharts renders to canvas and can't read CSS vars.
const PRIMARY = '#2563EB';
const SECONDARY = '#7C3AED';
const ACCENT = '#06B6D4';
const SUCCESS = '#22C55E';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';
const DONUT_PALETTE = [PRIMARY, SECONDARY, ACCENT, SUCCESS, WARNING, DANGER, '#0EA5E9', '#A855F7'];

@Component({
  selector: 'app-activity-report',
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './activity-report.component.html',
  styleUrl: './activity-report.component.css',
})
export class ActivityReportComponent {

  readonly svc = inject(AnalyticsService);
  private readonly theme = inject(ThemeService);

  readonly periods = PERIOD_OPTIONS;
  readonly period = signal<PeriodKey>('last30days');
  readonly drawerOpen = signal(false);
  /** True once the user has clicked Analyze at least once (drives the empty-state hero). */
  readonly analyzed = signal(false);

  // ── actions ──────────────────────────────────────────────────────────────

  setPeriod(p: PeriodKey): void {
    this.period.set(p);
  }

  analyze(): void {
    this.analyzed.set(true);
    this.drawerOpen.set(true);   // open immediately, show the generating animation inside
    this.svc.analyze(this.period());
  }

  openDrawer(): void {
    if (this.svc.report()) this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  print(): void {
    window.print();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) this.closeDrawer();
  }

  // ── presentation helpers ─────────────────────────────────────────────────

  statusClass(status: LanguageStatus | string): string {
    switch (status) {
      case 'EXCELLENT': return 'ok';
      case 'STABLE': return 'info';
      case 'NEEDS_ATTENTION': return 'warn';
      default: return 'info';
    }
  }

  statusLabel(status: LanguageStatus | string): string {
    return String(status).replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  overallClass(): string {
    const s = this.svc.report()?.overallAssessment.status;
    return s === 'EXCELLENT' ? 'ok' : s === 'GOOD' ? 'info' : 'warn';
  }

  /** Conic-gradient style for the health-score ring. */
  healthRing(): Record<string, string> {
    const score = this.svc.report()?.overallAssessment.healthScore ?? 0;
    const color = score >= 85 ? SUCCESS : score >= 70 ? PRIMARY : WARNING;
    return { background: `conic-gradient(${color} ${score * 3.6}deg, var(--border) 0deg)` };
  }

  // ── ECharts options (recompute on report + theme change) ─────────────────

  readonly studentGrowthOpt = computed(() => {
    const r = this.svc.report();
    return r ? this.areaOption(r.charts.studentGrowth, PRIMARY) : null;
  });

  readonly attendanceOpt = computed(() => {
    const r = this.svc.report();
    return r ? this.areaOption(r.charts.attendanceEvolution, ACCENT, 100) : null;
  });

  readonly examSuccessOpt = computed(() => {
    const r = this.svc.report();
    return r ? this.barOption(r.charts.examSuccess, SECONDARY, 100) : null;
  });

  readonly languageDonutOpt = computed(() => {
    const r = this.svc.report();
    return r ? this.donutOption(r.charts.languageDistribution) : null;
  });

  private axisColor(): string { return this.theme.isDark() ? '#94A3B8' : '#64748B'; }
  private splitColor(): string { return this.theme.isDark() ? '#334155' : '#E2E8F0'; }
  private surfaceColor(): string { return this.theme.isDark() ? '#1E293B' : '#FFFFFF'; }

  private baseAxes(categories: string[], max?: number) {
    return {
      grid: { left: 6, right: 18, top: 22, bottom: 6, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category', data: categories, boundaryGap: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: this.splitColor() } },
        axisLabel: { color: this.axisColor() },
      },
      yAxis: {
        type: 'value', max,
        splitLine: { lineStyle: { color: this.splitColor() } },
        axisLabel: { color: this.axisColor() },
      },
    };
  }

  private areaOption(data: ChartData, color: string, max?: number): Record<string, unknown> {
    return {
      ...this.baseAxes(data.categories, max),
      series: data.series.map((s) => ({
        name: s.name, type: 'line', smooth: true, showSymbol: true, symbol: 'circle', symbolSize: 7,
        data: s.data,
        lineStyle: { width: 3, color },
        itemStyle: { color, borderColor: this.surfaceColor(), borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: rgba(color, 0.32) }, { offset: 1, color: rgba(color, 0.02) }],
          },
        },
      })),
    };
  }

  private barOption(data: ChartData, color: string, max?: number): Record<string, unknown> {
    return {
      ...this.baseAxes(data.categories, max),
      series: data.series.map((s) => ({
        name: s.name, type: 'bar', data: s.data, barWidth: '46%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color }, { offset: 1, color: rgba(color, 0.55) }] },
        },
      })),
    };
  }

  private donutOption(items: NameValue[]): Record<string, unknown> {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, icon: 'circle', textStyle: { color: this.axisColor() } },
      series: [{
        type: 'pie', radius: ['46%', '72%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: this.surfaceColor(), borderWidth: 2, borderRadius: 6 },
        label: { show: false }, labelLine: { show: false },
        data: items.map((it, i) => ({ name: it.name, value: it.value, itemStyle: { color: DONUT_PALETTE[i % DONUT_PALETTE.length] } })),
      }],
    };
  }
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
