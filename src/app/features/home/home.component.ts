import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType, ReadyArgs, typeEventArgs } from 'keycloak-angular';
import { RevealDirective } from '@shared/directives/reveal.directive';

interface Feature   { icon: string; title: string; description: string; }
interface StatItem  { target: number; suffix: string; label: string; current: number; }
interface HomeCat   { name: string; icon: string; questions: number; color: string; }
interface Testimony { quote: string; name: string; role: string; rating: number; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RevealDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  private readonly keycloak = inject(Keycloak);
  private readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef);

  authenticated = signal(false);
  private statsAnimated = false;
  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      const event = this.keycloakSignal();
      if (event.type === KeycloakEventType.Ready) {
        this.authenticated.set(typeEventArgs<ReadyArgs>(event.args));
      }
      if (event.type === KeycloakEventType.AuthLogout) {
        this.authenticated.set(false);
      }
    });
  }

  // ── Données (fake — prêtes à être remplacées par une API) ───────
  readonly features: Feature[] = [
    { icon: 'code',          title: 'Interactive Coding Quizzes', description: 'Hands-on quizzes covering real-world programming scenarios with instant feedback.' },
    { icon: 'trending_up',   title: 'Real-Time Progress Tracking', description: 'Watch your skills grow with live progress indicators and detailed score history.' },
    { icon: 'category',      title: 'Multiple Categories',         description: 'From Java to Kubernetes — explore dozens of topics across the full dev stack.' },
    { icon: 'psychology',    title: 'AI-Assisted Learning',        description: 'Smart explanations and personalized recommendations powered by AI.' },
    { icon: 'emoji_events',  title: 'Gamified Experience',         description: 'Badges, streaks and leaderboards keep your motivation at its peak.' },
    { icon: 'insights',      title: 'Performance Analytics',       description: 'Deep analytics reveal your strengths and the areas worth practicing next.' },
  ];

  stats = signal<StatItem[]>([
    { target: 10000, suffix: '+', label: 'Students',           current: 0 },
    { target: 5000,  suffix: '+', label: 'Quizzes Completed',  current: 0 },
    { target: 50,    suffix: '+', label: 'Programming Topics', current: 0 },
    { target: 95,    suffix: '%', label: 'Success Rate',       current: 0 },
  ]);

  readonly popularCategories: HomeCat[] = [
    { name: 'Java',          icon: '☕', questions: 120, color: '#b45309' },
    { name: 'Spring Boot',   icon: '🌿', questions: 95,  color: '#16a34a' },
    { name: 'Angular',       icon: '🅰️', questions: 110, color: '#dc2626' },
    { name: 'React',         icon: '⚛️', questions: 88,  color: '#0891b2' },
    { name: 'JavaScript',    icon: '🟨', questions: 140, color: '#ca8a04' },
    { name: 'Docker',        icon: '🐳', questions: 64,  color: '#2563eb' },
    { name: 'Kubernetes',    icon: '☸️', questions: 52,  color: '#4f46e5' },
    { name: 'Microservices', icon: '🧩', questions: 47,  color: '#7c3aed' },
  ];

  readonly steps = [
    { icon: 'category',     title: 'Choose a category', description: 'Pick the technology you want to master among dozens of topics.' },
    { icon: 'quiz',         title: 'Take quizzes',      description: 'Answer interactive questions with a timer and instant feedback.' },
    { icon: 'monitoring',   title: 'Track your progress', description: 'Review your scores, spot weaknesses and watch yourself improve.' },
  ];

  readonly testimonials: Testimony[] = [
    { quote: 'QuizCodder helped me prepare for my technical interviews. The timed quizzes feel exactly like the real thing.', name: 'Sarah B.',  role: 'Full-Stack Developer', rating: 5 },
    { quote: 'An excellent way to learn while practicing. The instant explanations after each answer are a game changer.',   name: 'Mehdi K.',  role: 'Backend Engineer',     rating: 5 },
    { quote: 'I use it daily during my coffee break. My SQL and Docker skills improved dramatically in a month.',            name: 'Julie R.',  role: 'DevOps Engineer',      rating: 4 },
  ];

  ratingStars = computed(() => (n: number) => Array.from({ length: 5 }, (_, i) => i < n));

  // ── CTA ──────────────────────────────────────────────────────────
  startLearning(): void {
    if (this.authenticated()) {
      this.router.navigate(['/category']);
    } else {
      this.keycloak.login({ redirectUri: window.location.origin + '/' });
    }
  }

  browseCategories(): void {
    this.router.navigate(['/category']);
  }

  // ── Compteur animé déclenché à l'apparition de la section ───────
  ngAfterViewInit(): void {
    const section = this.host.nativeElement.querySelector('.stats-section');
    if (!section) return;

    this.observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !this.statsAnimated) {
        this.statsAnimated = true;
        this.animateStats();
        this.observer?.disconnect();
      }
    }, { threshold: 0.3 });
    this.observer.observe(section);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animateStats(): void {
    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      this.stats.update(list =>
        list.map(s => ({ ...s, current: Math.round(s.target * eased) }))
      );
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  formatStat(value: number): string {
    return value.toLocaleString('en-US');
  }
}
