import { Component, computed, inject, signal } from '@angular/core';
import { DiscoveredApp } from '../core/models/models';
import { Api } from '../services/api';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-discovery',
  imports: [TranslatePipe],
  templateUrl: './discovery.html',
  styleUrl: './discovery.css',
})
export class Discovery {
  private readonly api = inject(Api);

  readonly apps = signal<DiscoveredApp[]>([]);
  readonly scanning = signal(false);
  readonly lastScanAt = signal<string | null>(null);
  readonly lastDurationMs = signal<number | null>(null);
  readonly newAppIds = signal<Set<string>>(new Set());

  readonly newAppsCount = computed(() => this.apps().filter((app) => this.isNew(app.id)).length);

  readonly runningCount = computed(
    () => this.apps().filter((app) => app.status === 'running').length,
  );

  ngOnInit(): void {
    this.runScan();
  }

  runScan(): void {
    const previousIds = new Set(this.apps().map((app) => app.id));
    this.scanning.set(true);

    this.api.runDiscoveryScan().subscribe({
      next: (result) => {
        const freshIds = result.apps.filter((app) => !previousIds.has(app.id)).map((app) => app.id);

        this.apps.set(result.apps);
        this.newAppIds.set(new Set(freshIds));
        this.lastScanAt.set(new Date(result.scannedAt).toLocaleTimeString('de-DE'));
        this.lastDurationMs.set(result.durationMs);
        this.scanning.set(false);
      },
      error: (err) => {
        console.error(err);
        this.scanning.set(false);
      },
    });
  }

  isNew(appId: string): boolean {
    return this.newAppIds().has(appId);
  }

  openApp(app: DiscoveredApp): void {
    if (!app.url) {
      return;
    }
    window.open(app.url, '_blank');
  }
}
