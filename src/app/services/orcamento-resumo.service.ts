import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { OrcamentoResumo } from '../models/orcamento/orcamento.model';
import { DepositoDashboardService } from '../pages/deposito/dashboard/services/deposito-dashboard.service';

@Injectable({ providedIn: 'root' })
export class OrcamentoResumoService {
  constructor(private readonly dashboardService: DepositoDashboardService) {}

  buscarResumo(): Observable<OrcamentoResumo> {
    return this.dashboardService.buscarDashboard().pipe(map((response) => response.orcamentos));
  }
}
