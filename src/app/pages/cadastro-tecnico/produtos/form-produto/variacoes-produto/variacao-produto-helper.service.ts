import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';

@Injectable({ providedIn: 'root' })
export class VariacaoProdutoHelperService {
  constructor(private api: ApiService) {}

  carregarDadosIniciais(): Observable<{ materiais: any[]; formatos: any[]; servicos: any[]; acabamentos: any[] }> {
    return forkJoin({
      materiais: this.api.get<any>('api/materiais?page=0&size=500').pipe(map(res => res.content || [])),
      formatos: this.api.get<any>('api/formatos?page=0&size=500').pipe(map(res => res.content || [])),
      servicos: this.api.get<any>('api/servicos?page=0&size=500').pipe(map(res => res.content || [])),
      acabamentos: this.api.get<any>('api/acabamentos?page=0&size=500').pipe(map(res => res.content || []))
    });
  }

  buscarMateriais(filtro: string) {
    const params = filtro?.trim()
      ? `?page=0&size=50&textoPesquisa=${encodeURIComponent(filtro)}`
      : '?page=0&size=50';
  
    return this.api.get<any>(`api/materiais${params}`).pipe(
      map(res => res.content || [])
    );
  }

  buscarFormatos(filtro: string) {
    const params = filtro?.trim()
      ? `?page=0&size=50&textoPesquisa=${encodeURIComponent(filtro)}`
      : '?page=0&size=50';
  
    return this.api.get<any>(`api/formatos${params}`).pipe(
      map(res => res.content || [])
    );
  }

  buscarCores(filtro: string) {
    const params = filtro?.trim()
      ? `?page=0&size=50&textoPesquisa=${encodeURIComponent(filtro)}`
      : '?page=0&size=50';
    return this.api.get<any>(`api/cores${params}`).pipe(map(res => res.content || []));
  }
}
