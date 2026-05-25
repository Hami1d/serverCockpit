import { Module } from '@nestjs/common';
import { SystemModule } from './system/system.module';
import { DiscoveryModule } from './discovery/discovery.module';

@Module({
  imports: [SystemModule, DiscoveryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
