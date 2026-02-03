import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { FlowConfig, FlowStatus } from './pedido-flow.types';

@Injectable({ providedIn: 'root' })
export class PedidoFlowConfigService {
  private config$?: Observable<FlowConfig>;

  constructor(private http: HttpClient) { }

  getConfig(): Observable<FlowConfig> {
    if (!this.config$) {
      this.config$ = this.http.get<FlowConfig>('assets/config/pedido-flow.json').pipe(
        shareReplay(1)
      );
    }
    return this.config$;
  }

  getStatusMap(): Observable<Record<string, FlowStatus>> {
    return this.getConfig().pipe(
      map(cfg => {
        const mapStatus: Record<string, FlowStatus> = {};
        cfg.status.forEach(s => mapStatus[s.key.toUpperCase()] = s);
        return mapStatus;
      })
    );
  }
}
