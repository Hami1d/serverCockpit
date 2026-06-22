import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AppStatus, DiscoveredApp } from '../core/models/models';
import { Api } from '../services/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

const STATUS_COLOR: Record<AppStatus, string> = {
  running: 'var(--color-green)',
  idle: 'var(--color-amber)',
  stopped: 'var(--color-red)',
  unknown: 'var(--color-text-muted)',
};

@Component({
  selector: 'app-apps-component',
  imports: [TranslatePipe],
  templateUrl: './apps-component.html',
  styleUrl: './apps-component.css',
})
export class AppsComponent {
  private readonly api = inject(Api);
  private readonly destroyRef = inject(DestroyRef);

  readonly apps = signal<DiscoveredApp[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadApps();
  }

  loadApps(): void {
    this.loading.set(true);
    this.api
      .getInstalledApps()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.apps.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  getStatusColor(status: AppStatus): string {
    return STATUS_COLOR[status];
  }

  openApp(app: DiscoveredApp): void {
    if (!app.url) {
      return;
    }
    window.open(app.url, '_blank');
  }
}
