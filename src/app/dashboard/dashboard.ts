import { Component, inject, signal } from '@angular/core';
import { Api } from '../services/api';
import { SystemMetrics } from '../core/models/models';
import { Socket } from '../services/socket';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly api = inject(Api);
  private readonly socket = inject(Socket);

  readonly metrics = signal<SystemMetrics | null>(null);

  ngOnInit(): void {
    this.api.getSystemMetrics().subscribe({
      next: (data) => this.metrics.set(data),
      error: (err) => console.error(err),
    });

    this.socket.onMetrics().subscribe((data) => this.metrics.set(data));
  }
}
