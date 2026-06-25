import { Component, output, signal } from '@angular/core';

/**
 * Modal « Import Quiz File » — UI uniquement pour l'instant.
 * Le bouton Upload sera branché sur POST {apiUrl}/teacher/quizzes/import
 * (parsing Excel côté Quiz Service, puis événement RabbitMQ vers le
 * Notification Service qui préviendra les étudiants).
 */
@Component({
  selector: 'app-import-quiz-modal',
  templateUrl: './import-quiz-modal.component.html',
  styleUrl: './import-quiz-modal.component.css'
})
export class ImportQuizModalComponent {

  readonly closed = output<void>();

  readonly file = signal<File | null>(null);
  readonly dragging = signal(false);
  readonly invalidType = signal(false);

  private readonly allowed = ['.xlsx', '.xls'];

  close(): void {
    this.closed.emit();
  }

  onBrowse(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.selectFile(event.dataTransfer?.files?.[0] ?? null);
  }

  clearFile(): void {
    this.file.set(null);
    this.invalidType.set(false);
  }

  fileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private selectFile(file: File | null): void {
    if (!file) return;
    const valid = this.allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
    this.invalidType.set(!valid);
    this.file.set(valid ? file : null);
  }
}
