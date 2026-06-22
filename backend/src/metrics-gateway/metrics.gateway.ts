import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SystemService } from '../system/system/system.service';

const BROADCAST_INTERVAL_MS = 3000;

@WebSocketGateway({ cors: { origin: '*' } })
export class MetricsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(MetricsGateway.name);

  constructor(private readonly systemService: SystemService) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
    this.startBroadcasting();
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.sendMetricsToClient(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private startBroadcasting(): void {
    setInterval(() => this.broadcastToAll(), BROADCAST_INTERVAL_MS);
  }

  private async broadcastToAll(): Promise<void> {
    const connectedClients = this.server.sockets.sockets.size;

    if (connectedClients === 0) {
      return;
    }

    try {
      const metrics = await this.systemService.getAllMetrics();
      this.server.emit('metrics', metrics);
    } catch (error) {
      this.logger.error('Failed to broadcast metrics', error);
    }
  }

  private async sendMetricsToClient(client: Socket): Promise<void> {
    try {
      const metrics = await this.systemService.getAllMetrics();
      client.emit('metrics', metrics);
    } catch (error) {
      this.logger.error(`Failed to send metrics to client ${client.id}`, error);
    }
  }
}
