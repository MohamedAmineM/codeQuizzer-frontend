import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '@shared/directives/reveal.directive';

interface CoreValue { icon: string; title: string; description: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealDirective],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {

  readonly values: CoreValue[] = [
    { icon: 'school',        title: 'Continuous Learning', description: 'We believe growth never stops — every quiz is a step forward.' },
    { icon: 'lightbulb',     title: 'Innovation',          description: 'We constantly explore new ways to make learning interactive and fun.' },
    { icon: 'workspace_premium', title: 'Excellence',      description: 'Quality content, reviewed by experienced engineers.' },
    { icon: 'groups',        title: 'Community',           description: 'Developers helping developers — together we go further.' },
    { icon: 'accessibility_new', title: 'Accessibility',   description: 'Learning should be available to everyone, everywhere.' },
  ];
}
