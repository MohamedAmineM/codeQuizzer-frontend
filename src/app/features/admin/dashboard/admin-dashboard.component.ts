import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { HealthStatus } from '@shared/models/app-user.model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TimeAgoPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {

  readonly admin = inject(AdminService);

  readonly healthMeta: Record<HealthStatus, { label: string; cssClass: string }> = {
    UP:       { label: 'Opérationnel', cssClass: 'health-up' },
    DEGRADED: { label: 'Dégradé',      cssClass: 'health-degraded' },
    DOWN:     { label: 'Hors service', cssClass: 'health-down' },
  };
}
