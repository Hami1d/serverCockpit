import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, Observable, Subject } from 'rxjs';
import { SystemMetrics } from '../core/models/models';
import { baseUrl } from '../../../env';
import { io, Socket as SocketIo } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class Socket {
  private socket: SocketIo | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly isConnected = new Subject<boolean>();

  connect(): void {
    this.socket = io(baseUrl.API_BASE_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => this.isConnected.next(true));
    this.socket.on('disconnect', () => this.isConnected.next(false));
  }

  onMetrics(): Observable<SystemMetrics> {
    if (!this.socket) {
      this.connect();
    }

    return fromEvent<SystemMetrics>(this.socket!, 'metrics').pipe(
      takeUntilDestroyed(this.destroyRef),
    );
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }
}
