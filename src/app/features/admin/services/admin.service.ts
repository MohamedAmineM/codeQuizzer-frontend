import { Injectable, signal } from '@angular/core';
import { ActivityItem, AdminDashboardStats, SystemHealthItem } from '@shared/models/app-user.model';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/**
 * Tableau de bord d'administration. Mock pour l'instant — interface alignée
 * sur les futurs endpoints d'agrégation du gateway :
 *   GET {apiUrl}/admin/stats
 *   GET {apiUrl}/admin/health     (Spring Boot Actuator agrégé)
 *   GET {apiUrl}/admin/activities
 */
@Injectable({ providedIn: 'root' })
export class AdminService {

  readonly loading = signal(true);
  readonly stats = signal<AdminDashboardStats>({
    usersCount: 0, teachersCount: 0, studentsCount: 0,
    quizzesCount: 0, categoriesCount: 0, notificationsCount: 0,
  });
  readonly health = signal<SystemHealthItem[]>([]);
  readonly activities = signal<ActivityItem[]>([]);

  constructor() {
    this.load();
  }

  /** Mock — à remplacer par des appels HTTP, mêmes signatures. */
  load(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.stats.set({
        usersCount: 261, teachersCount: 12, studentsCount: 248,
        quizzesCount: 34, categoriesCount: 5, notificationsCount: 1024,
      });
      this.health.set([
        { service: 'API Gateway',          status: 'UP',       latencyMs: 12 },
        { service: 'Quiz Service',         status: 'UP',       latencyMs: 28 },
        { service: 'Assessment Service',   status: 'UP',       latencyMs: 35 },
        { service: 'Notification Service', status: 'DEGRADED', latencyMs: 220 },
        { service: 'Keycloak',             status: 'UP',       latencyMs: 18 },
        { service: 'RabbitMQ',             status: 'UP',       latencyMs: 6 },
      ]);
      this.activities.set([
        { id: 'a-1', icon: 'library_add',  label: 'Quiz publié',         detail: '« Java Streams & Collections » par John Doe',  timestamp: hoursAgo(2) },
        { id: 'a-2', icon: 'person_add',   label: 'Nouvel utilisateur',  detail: 'lina.k@example.com (Étudiant)',                timestamp: hoursAgo(5) },
        { id: 'a-3', icon: 'emoji_events', label: 'Quiz terminé',        detail: 'Sarah C. — Angular, 96 %',                     timestamp: hoursAgo(8) },
        { id: 'a-4', icon: 'campaign',     label: 'Notification envoyée', detail: '248 étudiants notifiés (nouveau quiz Java)',  timestamp: hoursAgo(12) },
        { id: 'a-5', icon: 'security',     label: 'Rôle modifié',        detail: 'alex.b@example.com promu Enseignant',          timestamp: hoursAgo(30) },
      ]);
      this.loading.set(false);
    }, 600);
  }
}
