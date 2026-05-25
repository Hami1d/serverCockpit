import { Injectable } from '@nestjs/common';
import si from 'systeminformation';

@Injectable()
export class SystemService {
  private bytesToGb(bytes: number): number {
    return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
  }

  async getCpuMetrics() {
    const [load, info] = await Promise.all([si.currentLoad(), si.cpu()]);

    return {
      usagePercent: Math.round(load.currentLoad),
      cores: info.cores,
      speedGhz: info.speed,
      brand: info.brand,
    };
  }

  async getMemoryMetrics() {
    const memory = await si.mem();

    return {
      totalGb: this.bytesToGb(memory.total),
      usedGb: this.bytesToGb(memory.used),
      usagePercent: Math.round((memory.used / memory.total) * 100),
    };
  }

  async getDiskMetrics() {
    const disks = await si.fsSize();
    const primaryDisk = disks.find((disk) => disk.mount === '/') ?? disks[0];

    return {
      totalGb: this.bytesToGb(primaryDisk.size),
      usedGb: this.bytesToGb(primaryDisk.used),
      usagePercent: Math.round(primaryDisk.use),
      mount: primaryDisk.mount,
    };
  }

  async getUptimeMetrics() {
    const time = si.time();

    return {
      seconds: time.uptime,
      days: Math.floor(time.uptime / 86400),
      hours: Math.floor((time.uptime % 86400) / 3600),
    };
  }

  async getAllMetrics() {
    const [cpu, memory, disk, uptime] = await Promise.all([
      this.getCpuMetrics(),
      this.getMemoryMetrics(),
      this.getDiskMetrics(),
      this.getUptimeMetrics(),
    ]);

    return {
      cpu,
      memory,
      disk,
      uptime,
    };
  }
}
