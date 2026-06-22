import { Module } from '@nestjs/common';
import { MetricsGateway } from './metrics.gateway';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  providers: [MetricsGateway],
})
export class MetricsGatewayModule {}
