import { Injectable, Signal, signal } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { ConfiguracaoAplicativos } from '../models/config/configuracao-aplicativos.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoAplicativosService {
  private readonly endpoint = 'api/configuracoes/aplicativos-atalhos';
  private readonly configuracaoState = signal<ConfiguracaoAplicativos | null>(null);
  private carregamento$?: Observable<ConfiguracaoAplicativos>;

  readonly configuracao: Signal<ConfiguracaoAplicativos | null> = this.configuracaoState.asReadonly();

  constructor(private readonly api: ApiService) {}

  carregar(force = false): Observable<ConfiguracaoAplicativos> {
    const cache = this.configuracaoState();

    if (cache && !force) {
      return of(cache);
    }

    if (this.carregamento$ && !force) {
      return this.carregamento$;
    }

    this.carregamento$ = this.api.get<ConfiguracaoAplicativos>(this.endpoint).pipe(
      map((configuracao) => this.normalizar(configuracao)),
      tap((configuracao) => this.configuracaoState.set(configuracao)),
      finalize(() => {
        this.carregamento$ = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.carregamento$;
  }

  salvar(payload: ConfiguracaoAplicativos): Observable<ConfiguracaoAplicativos> {
    return this.api.put<ConfiguracaoAplicativos>(this.endpoint, payload).pipe(
      map((configuracao) => this.normalizar(configuracao)),
      tap((configuracao) => this.configuracaoState.set(configuracao))
    );
  }

  private normalizar(configuracao: ConfiguracaoAplicativos): ConfiguracaoAplicativos {
    return {
      aplicativos: Array.isArray(configuracao?.aplicativos) ? configuracao.aplicativos : [],
      atalhos: Array.isArray(configuracao?.atalhos)
        ? [...configuracao.atalhos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        : [],
    };
  }
}
