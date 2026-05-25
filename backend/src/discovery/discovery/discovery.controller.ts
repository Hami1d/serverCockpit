import { Controller, Get } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('scan')
  runScan() {
    return this.discoveryService.runScan();
  }
}
