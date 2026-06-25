import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { TeacherStudents } from '@shared/models/teacher.model';

const EMPTY: TeacherStudents = { totalStudents: 0, activeStudents: 0, averageScore: 0, students: [] };

/**
 * Étudiants de l'enseignant connecté — GET /api/enrollments/teacher (Quiz Service
 * via le gateway). L'enseignant ne voit que les inscriptions de SES catégories ;
 * l'identité vient du JWT (sub), jamais d'un paramètre client.
 */
@Injectable({ providedIn: 'root' })
export class TeacherStudentsService {

  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/enrollments/teacher`;

  readonly loading = signal(true);
  readonly data = signal<TeacherStudents>(EMPTY);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<TeacherStudents>(this.url).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      // 401/403/réseau : déjà notifiés par errorInterceptor.
      error: () => this.loading.set(false),
    });
  }
}
