import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-card">
      <div class="skeleton-title"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-actions">
        <div class="skeleton-btn"></div>
        <div class="skeleton-btn"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      background-color: #d1b2e0;
      padding: 1.5rem;
      margin: 1rem 0;
      border-radius: 6px;
    }
    
    .skeleton-title, .skeleton-line, .skeleton-btn {
      background: linear-gradient(90deg, #b886d3 25%, #cb9be5 50%, #b886d3 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    
    .skeleton-title { height: 1.5rem; width: 60%; margin-bottom: 1rem; }
    .skeleton-line { height: 1rem; width: 100%; margin-bottom: 0.5rem; }
    .skeleton-line.short { width: 80%; margin-bottom: 1.5rem; }
    
    .skeleton-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    
    .skeleton-btn { height: 2rem; width: 5rem; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class Skeleton {}
