import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('metrics')
  getAllMetrics() {
    return this.systemService.getAllMetrics();
  }

  @Get('cpu')
  getCpuMetrics() {
    return this.systemService.getCpuMetrics();
  }

  @Get('memory')
  getMemoryMetrics() {
    return this.systemService.getMemoryMetrics();
  }

  @Get('disk')
  getDiskMetrics() {
    return this.systemService.getDiskMetrics();
  }

  @Get('uptime')
  getUptimeMetrics() {
    return this.systemService.getUptimeMetrics();
  }
}
