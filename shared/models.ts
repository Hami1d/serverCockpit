export interface CpuMetrics {
  usagePercent: number;
  cores: number;
  speedGhz: number;
  brand: string;
}

export interface MemoryMetrics {
  totalGb: number;
  usedGb: number;
  usagePercent: number;
}

export interface DiskMetrics {
  totalGb: number;
  usedGb: number;
  usagePercent: number;
  mount: string;
}

export interface UptimeMetrics {
  seconds: number;
  days: number;
  hours: number;
}

export interface SystemMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  uptime: UptimeMetrics;
}

export type AppStatus = 'running' | 'stopped' | 'idle' | 'unknown';

export type AppSource = 'port-scan' | 'docker' | 'systemd';

export type AppCategory =
  | 'container'
  | 'vpn'
  | 'storage'
  | 'monitoring'
  | 'media'
  | 'proxy'
  | 'automation'
  | 'security'
  | 'dns'
  | 'sync'
  | 'git'
  | 'admin'
  | 'lifestyle'
  | 'unknown';

export interface DiscoveredApp {
  id: string;
  name: string;
  icon: string;
  category: AppCategory;
  port: number | null;
  url: string | null;
  status: AppStatus;
  source: AppSource;
}

export interface ScanResult {
  apps: DiscoveredApp[];
  scannedAt: string;
  durationMs: number;
}
