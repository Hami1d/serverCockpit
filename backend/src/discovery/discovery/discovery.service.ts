import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import Docker from 'dockerode';
import {
  AppCategory,
  AppSource,
  AppStatus,
  DiscoveredApp,
  ScanResult,
} from '../../../shared/models';

const execAsync = promisify(exec);

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
        'ss -tlnp 2>/dev/null || lsof -i -P -n 2>/dev/null',
      );
      return this.parsePortsWithProcessNames(stdout);
    } catch {
      this.logger.warn('Port scan failed');
      return [];
    }
  }

  private parsePortsWithProcessNames(output: string): DiscoveredApp[] {
    const apps = new Map<number, DiscoveredApp>();

    // lsof format: processName pid user ... TCP *:PORT (LISTEN)
    const lsofPattern = /^(\S+)\s+\d+\s+\S+.*:(\d{4,5})\s+\(LISTEN\)/gm;

    // ss format: LISTEN ... *:PORT ... users:(("processName",...))
    const ssPattern = /LISTEN.*[:\s](\d{4,5})\s.*users:\(\("([^"]+)"/gm;

    let match: RegExpExecArray | null;

    while ((match = lsofPattern.exec(output)) !== null) {
      const processName = this.decodeProcessName(match[1]);
      const port = parseInt(match[2], 10);

      if (port >= 1024 && port <= 49999 && !apps.has(port)) {
        apps.set(port, this.buildPortApp(port, processName));
      }
    }

    while ((match = ssPattern.exec(output)) !== null) {
      const port = parseInt(match[1], 10);
      const processName = match[2];

      if (port >= 1024 && port <= 49999 && !apps.has(port)) {
        apps.set(port, this.buildPortApp(port, processName));
      }
    }

    return [...apps.values()];
  }

  private decodeProcessName(raw: string): string {
    return raw
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .trim();
  }

  private buildPortApp(
    port: number,
    processName: string = 'unknown',
  ): DiscoveredApp {
    return {
      id: `port-${port}`,
      name: processName,
      icon: '🔌',
      category: 'unknown' as AppCategory,
      port,
      url: `http://localhost:${port}`,
      status: 'running' as AppStatus,
      source: 'port-scan' as AppSource,
    };
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

    const tcpPort =
      container.Ports.find((p) => p.PublicPort && p.Type === 'tcp')
        ?.PublicPort ?? null;

    const status: AppStatus =
      container.State === 'running' ? 'running' : 'stopped';

    return {
      id: `docker-${container.Id.slice(0, 8)}`,
      name: containerName,
      icon: '🐳',
      category: 'docker' as AppCategory,
      port: tcpPort,
      url: tcpPort ? `http://localhost:${tcpPort}` : null,
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
      return [];
    }
  }

  private parseSystemdServices(output: string): DiscoveredApp[] {
    const ignoredPrefixes = [
      'systemd-',
      'dbus',
      'getty',
      'plymouth',
      'kmod',
      'setvtrgb',
      'blk-',
      'lvm2',
      'alsa',
      'keyboard',
      'console',
      'binfmt',
      'apparmor',
      'snapd',
      'user@',
      'user-runtime',
      'rtkit',
      'accounts',
      'colord',
      'pulseaudio',
      'avahi',
      'iio',
      'switcheroo',
      'upower',
      'udisks',
      'packagekit',
      'fwupd',
      'polkit',
      'rsyslog',
      'bluetooth',
      'cups',
      'gdm',
      'gnome',
      'flatpak',
      'kerneloops',
      'ModemManager',
      'NetworkManager',
      'power-profiles',
      'qemu',
      'thermald',
      'virtlogd',
      'libvirt',
      'wpa_supplicant',
      'zram',
      'unattended',
      'apport',
      'lm-sensors',
    ];

    return output
      .split('\n')
      .filter((line) => line.includes('.service'))
      .map((line) => {
        const serviceName =
          line.trim().split(/\s+/)[0]?.replace('.service', '') ?? '';
        return serviceName;
      })
      .filter((name) => {
        if (name === '') return false;
        return !ignoredPrefixes.some((prefix) =>
          name.toLowerCase().startsWith(prefix.toLowerCase()),
        );
      })
      .map((name) => ({
        id: `systemd-${name}`,
        name,
        icon: '⚙',
        category: 'unknown' as AppCategory,
        port: null,
        url: null,
        status: 'running' as AppStatus,
        source: 'systemd' as AppSource,
      }));
  }

  private mergeApps(...appLists: DiscoveredApp[][]): DiscoveredApp[] {
    const appsById = new Map<string, DiscoveredApp>();

    for (const list of appLists) {
      for (const app of list) {
        if (!appsById.has(app.id)) {
          appsById.set(app.id, app);
        }
      }
    }

    return [...appsById.values()];
  }
}
