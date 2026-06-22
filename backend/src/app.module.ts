import { Module } from '@nestjs/common';
import { SystemModule } from './system/system.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MetricsGatewayModule } from './metrics-gateway/metrics-gateway.module';
import { AppsModule } from './apps/apps.module';

@Module({
  imports: [SystemModule, DiscoveryModule, MetricsGatewayModule, AppsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
