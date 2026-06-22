import { HttpClient } from '@angular/common/http';
import { baseUrl } from './../../../env';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DiscoveredApp, ScanResult, SystemMetrics } from '../core/models/models';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly apiUrl = baseUrl.API_BASE_URL;
  private readonly http = inject(HttpClient);

  getSystemMetrics(): Observable<SystemMetrics> {
    return this.http.get<SystemMetrics>(`${this.apiUrl}/api/system/metrics`);
  }
  getInstalledApps(): Observable<DiscoveredApp[]> {
    return this.http.get<DiscoveredApp[]>(`${this.apiUrl}/api/apps`);
  }
  runDiscoveryScan(): Observable<ScanResult> {
    return this.http.get<ScanResult>(`${this.apiUrl}/api/discovery/scan`);
  }
}
