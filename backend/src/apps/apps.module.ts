import { Module } from '@nestjs/common';
import { AppsService } from './apps/apps.service';
import { AppsController } from './apps/apps.controller';
import { DiscoveryModule } from 'src/discovery/discovery.module';

@Module({
  providers: [AppsService],
  controllers: [AppsController],
  imports: [DiscoveryModule],
})
export class AppsModule {}
