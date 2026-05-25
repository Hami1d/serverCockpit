import { baseUrl } from './../../../env';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly apiUrl = baseUrl.API_BASE_URL;
}
