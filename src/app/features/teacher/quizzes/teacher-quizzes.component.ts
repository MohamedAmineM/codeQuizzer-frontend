import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TeacherService } from '../services/teacher.service';
import { QUIZ_STATUS_META } from '@shared/models/teacher.model';
import { ImportQuizModalComponent } from './import-quiz-modal/import-quiz-modal.component';

@Component({
  selector: 'app-teacher-quizzes',
  imports: [DatePipe, ImportQuizModalComponent],
  templateUrl: './teacher-quizzes.component.html',
  styleUrl: './teacher-quizzes.component.css'
})
export class TeacherQuizzesComponent {

  readonly teacher = inject(TeacherService);
  readonly statusMeta = QUIZ_STATUS_META;

  readonly importOpen = signal(false);
}
