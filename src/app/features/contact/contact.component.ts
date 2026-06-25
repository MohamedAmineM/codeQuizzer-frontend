import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RevealDirective } from '@shared/directives/reveal.directive';
import { ToastService } from '@core/services/toast.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RevealDirective],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {

  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(ToastService);

  state = signal<SubmitState>('idle');

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    subject:  ['', [Validators.required, Validators.minLength(3)]],
    message:  ['', [Validators.required, Validators.minLength(10)]],
  });

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /**
   * Envoi simulé — à remplacer par un vrai appel HTTP vers l'API
   * (ex. POST /api/contact, destinataire admin@quizcodder.com).
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('loading');

    setTimeout(() => {
      // Simule une réponse serveur réussie
      const ok = true;
      if (ok) {
        this.state.set('success');
        this.notify.success('Message sent! We will reply within 24 hours.');
        this.form.reset();
      } else {
        this.state.set('error');
        this.notify.error('Something went wrong. Please try again.');
      }
      setTimeout(() => this.state.set('idle'), 4000);
    }, 1200);
  }
}
