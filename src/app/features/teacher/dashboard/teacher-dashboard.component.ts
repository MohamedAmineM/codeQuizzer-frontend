import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeacherService } from '../services/teacher.service';
import { NotificationService } from '@features/notifications/services/notification.service';
import { NOTIFICATION_TYPE_META } from '@shared/models/notification.model';
import { QUIZ_STATUS_META } from '@shared/models/teacher.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, DatePipe, TimeAgoPipe],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css'
})
export class TeacherDashboardComponent {

  readonly teacher = inject(TeacherService);
  readonly notifications = inject(NotificationService);

  readonly typeMeta = NOTIFICATION_TYPE_META;
  readonly statusMeta = QUIZ_STATUS_META;

  readonly recentQuizzes = computed(() => this.teacher.quizzes().slice(0, 5));
  readonly recentNotifications = computed(() => this.notifications.notifications().slice(0, 4));
}
