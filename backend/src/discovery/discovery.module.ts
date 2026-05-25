import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery/discovery.service';
import { DiscoveryController } from './discovery/discovery.controller';

@Module({
  providers: [DiscoveryService],
  controllers: [DiscoveryController]
})
export class DiscoveryModule {}
