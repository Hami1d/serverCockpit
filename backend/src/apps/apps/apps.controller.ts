import { Controller, Get } from '@nestjs/common';
import { AppsService } from './apps.service';

@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  getInstalledApps() {
    return this.appsService.getInstalledApps();
  }
}
