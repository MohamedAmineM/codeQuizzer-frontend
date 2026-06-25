import { Component, OnDestroy, computed, effect, input, signal } from '@angular/core';

/**
 * Lecteur audio « professionnel » pour la section Listening. v1 sans fichiers
 * audio : utilise la synthèse vocale du navigateur (Web Speech API) pour lire le
 * script. Nombre de lectures limité (2 tentatives PAR question). Si la synthèse
 * n'est pas disponible, on propose la transcription en repli pour ne pas bloquer.
 */
@Component({
  selector: 'app-audio-player',
  imports: [],
  template: `
    <div class="player">
      <button class="play-btn" (click)="toggle()" [disabled]="!supported || (playsLeft() === 0 && !playing())"
              [attr.aria-label]="playing() ? 'Stop' : 'Play'">
        <span class="material-icons">{{ playing() ? 'stop' : (played() > 0 ? 'replay' : 'play_arrow') }}</span>
      </button>

      <div class="player-main">
        <div class="player-top">
          <span class="player-title">
            <span class="material-icons">graphic_eq</span> Listening clip
          </span>
          <span class="plays" [class.warn]="playsLeft() <= 1">
            {{ playsLeft() }} {{ playsLeft() === 1 ? 'play' : 'plays' }} left
          </span>
        </div>

        @if (playing()) {
          <div class="equalizer" aria-hidden="true">
            @for (b of bars; track $index) { <span [style.animation-delay.ms]="$index * 110"></span> }
          </div>
        } @else {
          <div class="track"><div class="track-fill" [style.width.%]="elapsed() * 100"></div></div>
        }
      </div>
    </div>

    @if (!supported) {
      <div class="fallback">
        <span class="material-icons">info</span>
        Audio playback isn’t available in this browser.
        <button class="link" (click)="showTranscript.set(!showTranscript())">
          {{ showTranscript() ? 'Hide' : 'Show' }} transcript
        </button>
      </div>
      @if (showTranscript()) { <p class="transcript">“{{ script() }}”</p> }
    }
  `,
  styles: [`
    :host { display: block; }
    .player {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 18px; border: 1px solid var(--border);
      border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-sm);
    }
    .play-btn {
      width: 54px; height: 54px; flex-shrink: 0; border: none; border-radius: 50%;
      background: var(--gradient-brand); color: #fff; box-shadow: var(--shadow-primary);
      display: flex; align-items: center; justify-content: center; transition: transform var(--transition);
    }
    .play-btn:hover:not(:disabled) { transform: scale(1.06); }
    .play-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .play-btn .material-icons { font-size: 28px; }
    .player-main { flex: 1; min-width: 0; }
    .player-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .player-title { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700; color: var(--text); }
    .player-title .material-icons { font-size: 18px; color: var(--primary); }
    .plays { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .plays.warn { color: var(--warning); }
    .track { height: 8px; border-radius: var(--radius-full); background: var(--bg); overflow: hidden; }
    .track-fill { height: 100%; border-radius: var(--radius-full); background: var(--gradient-brand); transition: width 0.12s linear; }
    .equalizer { display: flex; align-items: flex-end; gap: 4px; height: 26px; }
    .equalizer span {
      width: 5px; height: 100%; border-radius: 3px; background: var(--primary);
      animation: eq 0.9s ease-in-out infinite alternate; transform-origin: bottom;
    }
    @keyframes eq { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }
    .fallback { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; color: var(--text-muted); }
    .fallback .material-icons { font-size: 18px; }
    .link { border: none; background: none; color: var(--primary); font-weight: 700; font-size: 13px; }
    .transcript { margin: 8px 0 0; font-style: italic; color: var(--text-muted); }
  `],
})
export class AudioPlayerComponent implements OnDestroy {
  readonly script = input.required<string>();
  readonly maxPlays = input(2);

  readonly bars = [0, 1, 2, 3, 4, 5, 6];
  readonly playing = signal(false);
  readonly played = signal(0);
  readonly elapsed = signal(0);
  readonly showTranscript = signal(false);

  readonly supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  readonly playsLeft = computed(() => Math.max(0, this.maxPlays() - this.played()));

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Le lecteur est réutilisé d'une question de listening à l'autre (le bloc
    // n'est pas recréé) : on remet donc le compteur à zéro à chaque changement
    // de script → exactement 2 tentatives d'écoute PAR question.
    effect(() => {
      this.script(); // dépendance : se déclenche au passage à la question suivante
      if (this.supported) window.speechSynthesis.cancel();
      this.finish();
      this.played.set(0);
      this.elapsed.set(0);
    });
  }

  toggle(): void {
    if (!this.supported) return;
    if (this.playing()) { this.stop(); return; }
    if (this.playsLeft() === 0) return;
    this.play();
  }

  private play(): void {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(this.script());
    u.lang = 'en-US';
    u.rate = 0.95;

    const words = this.script().split(/\s+/).length;
    const durationMs = Math.max(2500, (words / 2.6) * 1000 / u.rate);
    this.elapsed.set(0);

    u.onend = () => { this.finish(); this.played.update((n) => n + 1); this.elapsed.set(1); };
    u.onerror = () => { this.finish(); };

    synth.cancel();
    synth.speak(u);
    this.playing.set(true);

    const startedAt = Date.now();
    this.timer = setInterval(() => {
      this.elapsed.set(Math.min(0.98, (Date.now() - startedAt) / durationMs));
    }, 100);
  }

  private stop(): void {
    window.speechSynthesis.cancel();
    this.finish();
  }

  private finish(): void {
    this.playing.set(false);
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  ngOnDestroy(): void {
    if (this.supported) window.speechSynthesis.cancel();
    if (this.timer) clearInterval(this.timer);
  }
}
