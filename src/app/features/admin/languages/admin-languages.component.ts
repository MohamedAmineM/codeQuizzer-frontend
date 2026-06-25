import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminLanguagesService, CreateCategoryBody } from './admin-languages.service';
import { UserService } from '../services/user.service';
import { ToastService } from '@core/services/toast.service';
import { CategoryInfo } from '@shared/models/quiz-question.model';

interface KnownTeacher {
  id: string;
  name: string;
}

/**
 * Administration des catégories « langue » : statistiques globales, création
 * de catégories, (ré)affectation des enseignants, et rapport d'inscriptions.
 */
@Component({
  selector: 'app-admin-languages',
  imports: [FormsModule],
  templateUrl: './admin-languages.component.html',
  styleUrl: './admin-languages.component.css',
})
export class AdminLanguagesComponent {

  readonly svc = inject(AdminLanguagesService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);

  /** Enseignants réels chargés depuis identity-service (GET /api/admin/users?role=ROLE_TEACHER). */
  readonly knownTeachers = signal<KnownTeacher[]>([]);

  readonly showCreate = signal(false);
  readonly assignFor = signal<CategoryInfo | null>(null);
  readonly saving = signal(false);

  createForm: CreateCategoryBody = this.blankCreate();
  assignForm = { teacherId: '', teacherName: '' };

  constructor() {
    this.users.listTeachers().subscribe({
      next: list => this.knownTeachers.set(
        list.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim() || u.email }))),
      error: () => {}, // 401/403/réseau déjà notifiés par errorInterceptor ; saisie manuelle du sub reste possible
    });
  }

  private blankCreate(): CreateCategoryBody {
    return { name: '', icon: '🌐', description: '', color: '#2563eb', difficulty: 'A1' };
  }

  // ── Création de catégorie ────────────────────────────────────────
  openCreate(): void {
    this.createForm = this.blankCreate();
    this.showCreate.set(true);
  }
  closeCreate(): void {
    this.showCreate.set(false);
  }
  submitCreate(): void {
    if (!this.createForm.name.trim()) {
      this.toast.info('Le nom de la catégorie est obligatoire.');
      return;
    }
    this.saving.set(true);
    this.svc.createCategory(this.createForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.svc.load();
        this.toast.success('Catégorie créée.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Échec de la création (nom déjà existant ?).');
      },
    });
  }

  // ── Affectation d'un enseignant ──────────────────────────────────
  openAssign(cat: CategoryInfo): void {
    this.assignForm = { teacherId: cat.teacherId ?? '', teacherName: cat.teacherName ?? '' };
    this.assignFor.set(cat);
  }
  closeAssign(): void {
    this.assignFor.set(null);
  }
  pickTeacher(id: string): void {
    const t = this.knownTeachers().find((k) => k.id === id);
    if (t) {
      this.assignForm = { teacherId: t.id, teacherName: t.name };
    }
  }
  submitAssign(): void {
    const cat = this.assignFor();
    if (!cat) return;
    if (!this.assignForm.teacherId.trim()) {
      this.toast.info("Le sub de l'enseignant est obligatoire.");
      return;
    }
    this.saving.set(true);
    this.svc.assignTeacher(cat.id, this.assignForm.teacherId.trim(), this.assignForm.teacherName.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.assignFor.set(null);
        this.svc.load();
        this.toast.success('Enseignant affecté.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error("Échec de l'affectation.");
      },
    });
  }
}
