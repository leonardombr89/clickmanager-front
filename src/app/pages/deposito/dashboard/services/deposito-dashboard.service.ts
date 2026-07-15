import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { DepositoDashboardResponse } from '../models/deposito-dashboard.models';

@Injectable({ providedIn: 'root' })
export class DepositoDashboardService {
  private readonly endpoint = 'api/deposito/dashboard';

  constructor(private readonly api: ApiService) {}

  buscarDashboard(): Observable<DepositoDashboardResponse> {
    return this.api.get<DepositoDashboardResponse>(this.endpoint);
  }
}
