import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { SitePublicoResponse } from './public-store.models';

@Injectable({ providedIn: 'root' })
export class PublicStoreService {
  constructor(private readonly api: ApiService) {}

  buscarPorSlug(slug: string): Observable<SitePublicoResponse> {
    return this.api.get<SitePublicoResponse>(`api/public/sites/${encodeURIComponent(slug)}`);
  }
}
