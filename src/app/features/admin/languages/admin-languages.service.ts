import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryInfo } from '@shared/models/quiz-question.model';
import { TeacherStudentRow } from '@shared/models/teacher.model';
import { AdminEnrollmentStats } from '@shared/models/enrollment.model';

const EMPTY_STATS: AdminEnrollmentStats = {
  totalCategories: 0, totalEnrollments: 0, distinctStudents: 0, averageScore: 0,
};

export interface CreateCategoryBody {
  name: string;
  icon?: string;
  description?: string;
  color?: string;
  difficulty?: string;
  teacherId?: string;
  teacherName?: string;
}

/**
 * Domaine admin « langues » : catalogue des catégories + affectation des
 * enseignants + rapport d'inscriptions + statistiques globales.
 * Routé par le gateway : /api/categories/** (écriture = ADMIN) et
 * /api/enrollments/admin/** (ADMIN).
 */
@Injectable({ providedIn: 'root' })
export class AdminLanguagesService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  readonly loading = signal(true);
  readonly categories = signal<CategoryInfo[]>([]);
  readonly stats = signal<AdminEnrollmentStats>(EMPTY_STATS);
  readonly report = signal<TeacherStudentRow[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      categories: this.http.get<CategoryInfo[]>(`${this.api}/categories`),
      stats: this.http.get<AdminEnrollmentStats>(`${this.api}/enrollments/admin/stats`),
      report: this.http.get<TeacherStudentRow[]>(`${this.api}/enrollments/admin/all`),
    }).subscribe({
      next: ({ categories, stats, report }) => {
        this.categories.set(categories);
        this.stats.set(stats);
        this.report.set(report);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor.
      error: () => this.loading.set(false),
    });
  }

  createCategory(body: CreateCategoryBody): Observable<CategoryInfo> {
    return this.http.post<CategoryInfo>(`${this.api}/categories`, body);
  }

  assignTeacher(categoryId: number, teacherId: string, teacherName: string): Observable<CategoryInfo> {
    return this.http.put<CategoryInfo>(`${this.api}/categories/${categoryId}/teacher`, { teacherId, teacherName });
  }
}
