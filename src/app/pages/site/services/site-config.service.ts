import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SiteConfigResponse, SiteConfigUpdateRequest } from '../models/site-config.models';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly endpoint = 'api/site/config';

  constructor(private readonly api: ApiService) {}

  buscar(): Observable<SiteConfigResponse> {
    return this.api.get<SiteConfigResponse>(this.endpoint);
  }

  atualizar(payload: SiteConfigUpdateRequest): Observable<SiteConfigResponse> {
    return this.api.put<SiteConfigResponse>(this.endpoint, payload);
  }

  atualizarFavicon(file: File): Observable<SiteConfigResponse> {
    const formData = new FormData();
    formData.append('favicon', file);
    return this.api.put<SiteConfigResponse>(`${this.endpoint}/favicon`, formData);
  }

  removerFavicon(): Observable<SiteConfigResponse> {
    return this.api.delete<SiteConfigResponse>(`${this.endpoint}/favicon`);
  }
}
