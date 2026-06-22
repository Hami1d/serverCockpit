import { Injectable } from '@nestjs/common';
import { DiscoveredApp } from '../../../shared/models';
import { DiscoveryService } from 'src/discovery/discovery/discovery.service';

@Injectable()
export class AppsService {
  constructor(private readonly discoveryService: DiscoveryService) {}

  async getInstalledApps(): Promise<DiscoveredApp[]> {
    const result = await this.discoveryService.runScan();
    return result.apps;
  }
}
