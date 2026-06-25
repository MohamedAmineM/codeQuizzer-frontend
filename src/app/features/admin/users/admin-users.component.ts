import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { UserService } from '../services/user.service';
import { AdminLanguagesService } from '../languages/admin-languages.service';
import { ToastService } from '@core/services/toast.service';
import { AppRole, ROLE_LABELS } from '@core/auth/roles';
import { AdminUser, CreateUserPayload, USER_STATUS_META } from '@shared/models/app-user.model';

type RoleFilter = 'ALL' | AppRole;
type DialogKind = 'create' | 'role' | 'status' | 'password';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent {

  readonly usersService = inject(UserService);
  private readonly langSvc = inject(AdminLanguagesService);
  private readonly toast = inject(ToastService);

  /** Catégories/langues = « matières » assignables à un enseignant. */
  readonly subjects = this.langSvc.categories;

  readonly roleLabels = ROLE_LABELS;
  readonly statusMeta = USER_STATUS_META;

  readonly search = signal('');
  readonly roleFilter = signal<RoleFilter>('ALL');

  readonly roleFilters: { value: RoleFilter; label: string }[] = [
    { value: 'ALL',           label: 'Tous' },
    { value: AppRole.Admin,   label: 'Admins' },
    { value: AppRole.Teacher, label: 'Enseignants' },
    { value: AppRole.Student, label: 'Étudiants' },
  ];

  /** Rôles assignables depuis le dialog « Modifier le rôle » / la création. */
  readonly assignableRoles: AppRole[] = [AppRole.Admin, AppRole.Teacher, AppRole.Student];

  /** Niveaux CEFR pour le profil étudiant. */
  readonly cefrLevels: string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  private searchDebounce?: ReturnType<typeof setTimeout>;

  // ── État des dialogs d'action ───────────────────────────────────────
  readonly dialog = signal<DialogKind | null>(null);
  readonly activeUser = signal<AdminUser | null>(null);
  readonly selectedRole = signal<AppRole | null>(null);
  readonly newPassword = signal('');
  readonly pwdError = signal('');
  readonly submitting = signal(false);

  // ── Formulaire de création ──────────────────────────────────────────
  readonly createForm = signal<CreateUserPayload>(this.emptyForm());
  readonly createError = signal('');
  /** Ids des catégories (matières) sélectionnées — uniquement pour un enseignant. */
  readonly selectedSubjects = signal<number[]>([]);

  constructor() {
    this.reload(0);
  }

  /** Recharge en envoyant l'état courant (recherche + filtre) au backend. */
  private reload(page: number): void {
    this.usersService.load({ page, search: this.search(), role: this.roleFilter() });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reload(0), 350);
  }

  setRole(role: RoleFilter): void {
    if (this.roleFilter() === role) return;
    this.roleFilter.set(role);
    this.reload(0);
  }

  retry(): void { this.reload(this.usersService.page()); }

  // ── Pagination ──────────────────────────────────────────────────────
  get rangeLabel(): string {
    const total = this.usersService.totalElements();
    if (total === 0) return '0';
    const start = this.usersService.page() * this.usersService.size() + 1;
    const end = Math.min(start + this.usersService.size() - 1, total);
    return `${start}–${end} sur ${total}`;
  }
  canPrev(): boolean { return this.usersService.page() > 0; }
  canNext(): boolean { return this.usersService.page() + 1 < this.usersService.totalPages(); }
  prev(): void { if (this.canPrev()) this.reload(this.usersService.page() - 1); }
  next(): void { if (this.canNext()) this.reload(this.usersService.page() + 1); }

  initials(u: AdminUser): string {
    return ((u.firstName?.charAt(0) ?? '') + (u.lastName?.charAt(0) ?? '')).toUpperCase() || '?';
  }

  roleBadgeClass(role: AppRole): string {
    switch (role) {
      case AppRole.Admin:   return 'badge badge-danger';
      case AppRole.Teacher: return 'badge badge-accent';
      default:              return 'badge';
    }
  }

  fullName(u: AdminUser): string {
    return `${u.firstName} ${u.lastName}`.trim() || u.email;
  }

  // ── Ouverture des dialogs ───────────────────────────────────────────
  openRole(u: AdminUser): void {
    this.activeUser.set(u);
    this.selectedRole.set(u.role);
    this.dialog.set('role');
  }

  openStatus(u: AdminUser): void {
    this.activeUser.set(u);
    this.dialog.set('status');
  }

  openPassword(u: AdminUser): void {
    this.activeUser.set(u);
    this.newPassword.set('');
    this.pwdError.set('');
    this.dialog.set('password');
  }

  openCreate(): void {
    this.createForm.set(this.emptyForm());
    this.selectedSubjects.set([]);
    this.createError.set('');
    if (this.subjects().length === 0) this.langSvc.load(); // catalogue des matières pour le multi-select
    this.dialog.set('create');
  }

  /** Vrai si le rôle choisi dans le formulaire de création est « Enseignant ». */
  creatingTeacher(): boolean {
    return this.createForm().role === AppRole.Teacher;
  }

  isSubjectSelected(categoryId: number): boolean {
    return this.selectedSubjects().includes(categoryId);
  }

  toggleSubject(categoryId: number): void {
    this.selectedSubjects.update(ids =>
      ids.includes(categoryId) ? ids.filter(id => id !== categoryId) : [...ids, categoryId]);
  }

  closeDialog(): void {
    if (this.submitting()) return;
    this.dialog.set(null);
    this.activeUser.set(null);
    this.selectedRole.set(null);
    this.newPassword.set('');
    this.pwdError.set('');
    this.createError.set('');
    this.selectedSubjects.set([]);
  }

  private emptyForm(): CreateUserPayload {
    return {
      firstName: '', lastName: '', email: '', role: AppRole.Student, password: '',
      phone: '', nativeLanguage: '', currentLevel: '', bio: '', avatarUrl: '',
    };
  }

  /** Met à jour un champ du formulaire de création (binding template). */
  updateCreate<K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]): void {
    this.createForm.update(f => ({ ...f, [key]: value }));
  }

  /** Libellé contextuel pour l'action statut (suspendre ⇄ réactiver). */
  willReactivate(u: AdminUser | null): boolean {
    return u?.status === 'SUSPENDED';
  }

  // ── Confirmation des actions ────────────────────────────────────────
  confirmRole(): void {
    const u = this.activeUser();
    const role = this.selectedRole();
    if (!u || !role || role === u.role) { this.closeDialog(); return; }

    this.submitting.set(true);
    this.usersService.changeRole(u.id, role).subscribe({
      next: () => {
        this.toast.success(`Rôle de ${this.fullName(u)} mis à jour : ${this.roleLabels[role]}.`);
        this.afterMutation();
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Échec de la mise à jour du rôle.'),
    });
  }

  confirmStatus(): void {
    const u = this.activeUser();
    if (!u) { this.closeDialog(); return; }
    const enable = this.willReactivate(u);

    this.submitting.set(true);
    this.usersService.setStatus(u.id, enable).subscribe({
      next: () => {
        this.toast.success(`${this.fullName(u)} ${enable ? 'réactivé' : 'suspendu'}.`);
        this.afterMutation();
      },
      error: (err: HttpErrorResponse) =>
        this.handleError(err, `Échec de la ${enable ? 'réactivation' : 'suspension'} du compte.`),
    });
  }

  confirmPassword(): void {
    const u = this.activeUser();
    if (!u) { this.closeDialog(); return; }
    const pwd = this.newPassword().trim();
    if (pwd.length < 8) {
      this.pwdError.set('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    this.pwdError.set('');
    this.submitting.set(true);
    this.usersService.resetPassword(u.id, pwd).subscribe({
      next: () => {
        this.toast.success(`Mot de passe de ${this.fullName(u)} réinitialisé (temporaire).`);
        this.submitting.set(false);
        this.closeDialog();
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Échec de la réinitialisation du mot de passe.'),
    });
  }

  /** Génère un mot de passe temporaire fort côté client (l'admin le communique). */
  generatePassword(): void {
    this.newPassword.set(this.randomPassword());
    this.pwdError.set('');
  }

  generateCreatePassword(): void {
    this.updateCreate('password', this.randomPassword());
    this.createError.set('');
  }

  private randomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    const bytes = new Uint32Array(14);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }

  // ── Création d'un utilisateur ───────────────────────────────────────
  confirmCreate(): void {
    const f = this.createForm();
    const error = this.validateCreate(f);
    if (error) { this.createError.set(error); return; }

    this.createError.set('');
    this.submitting.set(true);
    const name = `${f.firstName.trim()} ${f.lastName.trim()}`.trim();
    const subjectIds = this.creatingTeacher() ? this.selectedSubjects() : [];

    this.usersService.createUser({
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      role: f.role,
      password: f.password.trim(),
      phone: f.phone?.trim() || null,
      nativeLanguage: f.nativeLanguage?.trim() || null,
      currentLevel: f.currentLevel?.trim() || null,
      bio: f.bio?.trim() || null,
      avatarUrl: f.avatarUrl?.trim() || null,
    }).subscribe({
      next: (created) => {
        if (subjectIds.length === 0) {
          this.toast.success(`Utilisateur ${name} créé.`);
          this.afterMutation();
          return;
        }
        // Affecte l'enseignant aux matières choisies (PUT /api/categories/{id}/teacher).
        forkJoin(subjectIds.map(id => this.langSvc.assignTeacher(id, created.id, name))).subscribe({
          next: () => {
            this.toast.success(`Enseignant ${name} créé et affecté à ${subjectIds.length} matière(s).`);
            this.langSvc.load(); // rafraîchit le catalogue (titulaires à jour)
            this.afterMutation();
          },
          error: () => {
            this.toast.error(`${name} créé, mais l'affectation des matières a échoué — réessayez via « Languages ».`);
            this.afterMutation();
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.createError.set('Un utilisateur avec cet email existe déjà.');
          this.submitting.set(false);
        } else if (err.status === 400) {
          this.createError.set('Données invalides. Vérifiez les champs requis.');
          this.submitting.set(false);
        } else {
          this.handleError(err, "Échec de la création de l'utilisateur.");
        }
      },
    });
  }

  private validateCreate(f: CreateUserPayload): string {
    if (!f.firstName.trim() || !f.lastName.trim()) return 'Prénom et nom sont requis.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Adresse email invalide.';
    if (!f.role) return 'Le rôle est requis.';
    if (f.password.trim().length < 8) return 'Le mot de passe doit comporter au moins 8 caractères.';
    return '';
  }

  // ── Cycle de vie d'une mutation ─────────────────────────────────────
  private afterMutation(): void {
    this.submitting.set(false);
    this.closeDialog();
    this.reload(this.usersService.page());
  }

  /**
   * 401/403/réseau (status 0) sont déjà notifiés par l'errorInterceptor — on ne
   * double pas le toast ; on ferme juste le dialog. Les autres erreurs (400/404/409/500)
   * obtiennent un message spécifique à l'action.
   */
  private handleError(err: HttpErrorResponse, message: string): void {
    this.submitting.set(false);
    this.closeDialog();
    if (![401, 403, 0].includes(err.status)) {
      this.toast.error(message);
    }
  }
}
