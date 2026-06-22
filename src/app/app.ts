import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Sidebar } from './sidebar/sidebar';
import { Socket } from './services/socket';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly socket = inject(Socket);
  private readonly destroyRef = inject(DestroyRef);

  readonly isConnected = signal(false);

  ngOnInit(): void {
    this.socket.connect();
    this.socket.isConnected
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => this.isConnected.set(status));
  }
}
