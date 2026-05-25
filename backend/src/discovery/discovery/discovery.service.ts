import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import {
  AppCategory,
  AppSource,
  AppStatus,
  DiscoveredApp,
  ScanResult,
} from 'shared/models';
import { promisify } from 'util';
import Docker from 'dockerode';

const execAsync = promisify(exec);
// TODO: offload
interface AppFingerprint {
  name: string;
  port: number;
  icon: string;
  category: AppCategory;
  urlPath: string;
}

const APP_FINGERPRINTS: AppFingerprint[] = [
  {
    name: 'Portainer',
    port: 9443,
    icon: '🐳',
    category: 'container',
    urlPath: '/',
  },
  {
    name: 'WireGuard UI',
    port: 51821,
    icon: '🔒',
    category: 'vpn',
    urlPath: '/',
  },
  {
    name: 'Nextcloud',
    port: 8080,
    icon: '☁',
    category: 'storage',
    urlPath: '/',
  },
  {
    name: 'Grafana',
    port: 3001,
    icon: '📊',
    category: 'monitoring',
    urlPath: '/',
  },
  {
    name: 'Jellyfin',
    port: 8096,
    icon: '🎬',
    category: 'media',
    urlPath: '/web/',
  },
  {
    name: 'Nginx Proxy Manager',
    port: 81,
    icon: '🌐',
    category: 'proxy',
    urlPath: '/',
  },
  {
    name: 'Home Assistant',
    port: 8123,
    icon: '🏠',
    category: 'automation',
    urlPath: '/',
  },
  {
    name: 'Vaultwarden',
    port: 8222,
    icon: '🔑',
    category: 'security',
    urlPath: '/',
  },
  {
    name: 'Pi-hole',
    port: 8053,
    icon: '🕳',
    category: 'dns',
    urlPath: '/admin/',
  },
  { name: 'Syncthing', port: 8384, icon: '🔄', category: 'sync', urlPath: '/' },
  {
    name: 'Uptime Kuma',
    port: 3002,
    icon: '📡',
    category: 'monitoring',
    urlPath: '/',
  },
  {
    name: 'Prometheus',
    port: 9090,
    icon: '🔥',
    category: 'monitoring',
    urlPath: '/',
  },
  { name: 'Gitea', port: 3003, icon: '🐱', category: 'git', urlPath: '/' },
  {
    name: 'Mealie',
    port: 9000,
    icon: '🍽',
    category: 'lifestyle',
    urlPath: '/',
  },
  {
    name: 'Netdata',
    port: 19999,
    icon: '📈',
    category: 'monitoring',
    urlPath: '/',
  },
  { name: 'Plex', port: 32400, icon: '▶', category: 'media', urlPath: '/web/' },
  {
    name: 'AdGuard Home',
    port: 3000,
    icon: '🛡',
    category: 'dns',
    urlPath: '/',
  },
];

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private dockerClient: Docker | null = null;

  constructor() {
    this.initDockerClient();
  }

  private initDockerClient(): void {
    try {
      this.dockerClient = new Docker({ socketPath: '/var/run/docker.sock' });
      this.logger.log('Docker client initialized');
    } catch {
      this.logger.warn('Docker socket not accessible');
    }
  }

  async runScan(): Promise<ScanResult> {
    const startTime = Date.now();

    const [portApps, dockerApps, systemdApps] = await Promise.all([
      this.discoverByPortScan(),
      this.discoverDockerContainers(),
      this.discoverSystemdServices(),
    ]);

    const apps = this.mergeApps(portApps, dockerApps, systemdApps);

    return {
      apps,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  private async discoverByPortScan(): Promise<DiscoveredApp[]> {
    try {
      const { stdout } = await execAsync(
        'ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null',
      );
      const openPorts = this.parseOpenPorts(stdout);
      return this.matchPortsToFingerprints(openPorts);
    } catch {
      this.logger.warn('Port scan failed');
      return [];
    }
  }

  private parseOpenPorts(ssOutput: string): number[] {
    const portPattern = /[:\s](\d{2,5})\s/g;
    const ports = new Set<number>();
    let match: RegExpExecArray | null;

    while ((match = portPattern.exec(ssOutput)) !== null) {
      const port = parseInt(match[1], 10);
      if (port >= 80 && port <= 65535) {
        ports.add(port);
      }
    }

    return [...ports];
  }

  private matchPortsToFingerprints(openPorts: number[]): DiscoveredApp[] {
    return APP_FINGERPRINTS.filter((fp) => openPorts.includes(fp.port)).map(
      (fp) => this.buildApp(fp, 'port-scan', 'running'),
    );
  }

  private async discoverDockerContainers(): Promise<DiscoveredApp[]> {
    if (!this.dockerClient) {
      return [];
    }

    try {
      const containers = await this.dockerClient.listContainers({ all: true });
      return containers.map((container) => this.mapContainerToApp(container));
    } catch {
      this.logger.warn('Docker discovery failed');
      return [];
    }
  }

  private mapContainerToApp(container: Docker.ContainerInfo): DiscoveredApp {
    const containerName = container.Names[0]?.replace('/', '') ?? 'unknown';
    const publicPort =
      container.Ports.find((p) => p.PublicPort)?.PublicPort ?? null;
    const status: AppStatus =
      container.State === 'running' ? 'running' : 'stopped';

    const matchedFingerprint = APP_FINGERPRINTS.find((fp) =>
      containerName
        .toLowerCase()
        .includes(fp.name.toLowerCase().replace(/\s+/g, '')),
    );

    return {
      id: `docker-${container.Id.slice(0, 8)}`,
      name: matchedFingerprint?.name ?? containerName,
      icon: matchedFingerprint?.icon ?? '📦',
      category: matchedFingerprint?.category ?? 'unknown',
      port: publicPort,
      url: publicPort ? `http://localhost:${publicPort}` : null,
      status,
      source: 'docker',
    };
  }

  private async discoverSystemdServices(): Promise<DiscoveredApp[]> {
    try {
      const { stdout } = await execAsync(
        'systemctl list-units --type=service --state=active --no-pager --plain 2>/dev/null',
      );
      return this.parseSystemdServices(stdout);
    } catch {
      this.logger.warn('systemd discovery failed');
      return [];
    }
  }

  private parseSystemdServices(output: string): DiscoveredApp[] {
    return output
      .split('\n')
      .filter((line) => line.includes('.service'))
      .flatMap((line) => {
        const serviceName =
          line.trim().split(/\s+/)[0]?.replace('.service', '') ?? '';
        const matched = APP_FINGERPRINTS.find((fp) =>
          serviceName
            .toLowerCase()
            .includes(fp.name.toLowerCase().split(' ')[0]),
        );

        if (!matched) {
          return [];
        }

        return [this.buildApp(matched, 'systemd', 'running')];
      });
  }

  private buildApp(
    fp: AppFingerprint,
    source: AppSource,
    status: AppStatus,
  ): DiscoveredApp {
    return {
      id: `${source}-${fp.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: fp.name,
      icon: fp.icon,
      category: fp.category,
      port: fp.port,
      url: `http://localhost:${fp.port}${fp.urlPath}`,
      status,
      source,
    };
  }

  private mergeApps(...appLists: DiscoveredApp[][]): DiscoveredApp[] {
    const appsByName = new Map<string, DiscoveredApp>();

    for (const list of appLists) {
      for (const app of list) {
        const existing = appsByName.get(app.name);
        if (!existing) {
          appsByName.set(app.name, app);
        } else {
          appsByName.set(app.name, { ...existing, ...app });
        }
      }
    }

    return [...appsByName.values()];
  }
}
