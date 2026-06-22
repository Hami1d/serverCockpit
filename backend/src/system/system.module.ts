import { Module } from '@nestjs/common';
import { SystemService } from './system/system.service';
import { SystemController } from './system/system.controller';

@Module({
  providers: [SystemService],
  controllers: [SystemController],
  exports: [SystemService],
})
export class SystemModule {}
