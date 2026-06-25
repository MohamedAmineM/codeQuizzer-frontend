/**
 * Mirror of the analytics-service `ActivityReport` contract (Phase 5). This is the stable seam:
 * when the backend swaps its rule-based generator for an LLM, this shape — and this page — stay the same.
 */

export type Trend = 'UP' | 'DOWN' | 'FLAT';
export type LanguageStatus = 'EXCELLENT' | 'STABLE' | 'NEEDS_ATTENTION';
export type OverallStatus = 'EXCELLENT' | 'GOOD' | 'AT_RISK';
export type PeriodKey = 'last7days' | 'last30days' | 'currentMonth' | 'previousMonth';

export interface Kpi {
  key: string;
  label: string;
  icon: string;
  value: number;
  unit: string | null;
  trendPercent: number;
  trend: Trend;
}

export interface Series { name: string; data: number[]; }
export interface ChartData { categories: string[]; series: Series[]; }
export interface NameValue { name: string; value: number; }

export interface Charts {
  studentGrowth: ChartData;
  attendanceEvolution: ChartData;
  examSuccess: ChartData;
  languageDistribution: NameValue[];
}

export interface SchoolOverview {
  totalStudents: number;
  newStudents: number;
  activeStudents: number;
  attendanceRate: number;
  examSuccessRate: number;
  certificatesDelivered: number;
}

export interface LanguagePerformance {
  language: string;
  students: number;
  successRate: number;
  attendance: number;
  status: LanguageStatus;
}

export interface TopTeacher { name: string; successRate: number; attendanceRate: number; satisfaction: string; }
export interface SupportTeacher { name: string; note: string; recommendation: string; }
export interface TeacherPerformance { top: TopTeacher; needsSupport: SupportTeacher[]; }

export interface Retention { atRiskCount: number; indicators: string[]; recommendation: string; }
export interface Promotion { from: string; to: string; count: number; }
export interface CefrProgression { promotions: Promotion[]; trend: string; }
export interface OverallAssessment { healthScore: number; status: OverallStatus; narrative: string; }
export interface PeriodInfo { key: string; label: string; from: string; to: string; }

export interface ActivityReport {
  generatedAt: string;
  period: PeriodInfo;
  kpis: Kpi[];
  charts: Charts;
  executiveSummary: string[];
  schoolOverview: SchoolOverview;
  languagePerformance: LanguagePerformance[];
  teacherPerformance: TeacherPerformance;
  retention: Retention;
  cefrProgression: CefrProgression;
  risks: string[];
  recommendedActions: string[];
  overallAssessment: OverallAssessment;
}

export const PERIOD_OPTIONS: ReadonlyArray<{ key: PeriodKey; label: string }> = [
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'last30days', label: 'Last 30 Days' },
  { key: 'currentMonth', label: 'This Month' },
  { key: 'previousMonth', label: 'Previous Month' },
];
