import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ResultService } from '@features/results/services/result.service';
import { ProfileService } from '@features/profile/services/profile.service';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

interface Achievement {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

/** Brouillon d'édition — uniquement les champs modifiables du profil métier. */
interface ProfileForm {
  displayName: string;
  nativeLanguage: string;
  phone: string;
  avatarUrl: string;
  bio: string;
}

@Component({
  selector: 'app-user-profile',
  imports: [DatePipe, FormsModule, RouterLink, TimeAgoPipe],
  templateUrl: 'user-profile.component.html',
  styleUrls: ['user-profile.component.css']
})
export class UserProfileComponent {

  readonly auth = inject(AuthService);
  /**
   * Statistiques : ASSESSMENT SERVICE (results.stats() ← GET /api/assessments/stats/me).
   * Profil métier : IDENTITY SERVICE (profile() ← GET /api/profiles/me), provisionné
   * à la volée au login. Keycloak reste la source de vérité de l'identité.
   */
  readonly results = inject(ResultService);
  private readonly profiles = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly keycloak = inject(Keycloak);

  /** Profil métier (identity-service) — null tant qu'il n'est pas chargé. */
  readonly profile = this.profiles.profile;

  readonly editing = signal(false);
  form: ProfileForm = this.blank();

  constructor() {
    // Idempotent : garantit le chargement même en arrivant directement sur /profile
    // (AppComponent l'amorce déjà au login).
    this.profiles.ensureProvisioned();
  }

  /** La route est gardée : on attend le chargement du profil Keycloak. */
  readonly loading = computed(() => this.auth.user() === undefined);

  /** Nom affiché : profil métier en priorité, repli sur le profil Keycloak. */
  readonly displayName = computed(() => this.profile()?.displayName?.trim() || this.auth.fullName());

  /** Moyenne serveur arrondie pour l'affichage. */
  readonly averageScore = computed(() => Math.round(this.results.stats().successRate));

  readonly memberSince = computed(() => {
    const ts = (this.auth.user() as { createdTimestamp?: number } | undefined)?.createdTimestamp;
    return ts ? new Date(ts) : null;
  });

  readonly recentActivity = computed(() => this.results.history().slice(0, 4));

  readonly achievements = computed<Achievement[]>(() => {
    const s = this.results.stats();
    const avg = this.averageScore();
    const categories = this.results.categoryPerformance().length;
    return [
      { icon: 'rocket_launch',         title: 'Premier pas',  description: 'Compléter un premier quiz',          unlocked: s.quizzesCompleted >= 1 },
      { icon: 'local_fire_department', title: 'Habitué',      description: 'Compléter 5 quiz',                   unlocked: s.quizzesCompleted >= 5 },
      { icon: 'emoji_events',          title: 'Excellent',    description: 'Obtenir un score de 90 % ou plus',   unlocked: s.bestScore >= 90 },
      { icon: 'workspace_premium',     title: 'Sans faute',   description: 'Réussir un quiz à 100 %',            unlocked: s.bestScore >= 100 },
      { icon: 'ads_click',             title: 'Précis',       description: 'Moyenne générale au-dessus de 75 %', unlocked: avg >= 75 },
      { icon: 'explore',               title: 'Explorateur',  description: 'Jouer dans 3 catégories',            unlocked: categories >= 3 },
    ];
  });

  readonly unlockedCount = computed(() => this.achievements().filter((a) => a.unlocked).length);

  /** Ouvre le formulaire pré-rempli avec le profil courant. */
  startEdit(): void {
    const p = this.profile();
    this.form = {
      displayName: p?.displayName ?? '',
      nativeLanguage: p?.nativeLanguage ?? '',
      phone: p?.phone ?? '',
      avatarUrl: p?.avatarUrl ?? '',
      bio: p?.bio ?? '',
    };
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  save(): void {
    const f = this.form;
    this.profiles.updateProfile({
      displayName: f.displayName.trim(),
      nativeLanguage: f.nativeLanguage.trim(),
      phone: f.phone.trim(),
      avatarUrl: f.avatarUrl.trim(),
      bio: f.bio.trim(),
    }).subscribe({
      next: () => { this.toast.success('Profil mis à jour.'); this.editing.set(false); },
      error: () => this.toast.error('Impossible de mettre à jour le profil.'),
    });
  }

  manageAccount(): void {
    void this.keycloak.accountManagement();
  }

  private blank(): ProfileForm {
    return { displayName: '', nativeLanguage: '', phone: '', avatarUrl: '', bio: '' };
  }
}
