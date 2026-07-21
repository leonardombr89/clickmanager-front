import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { TipoEmpresa, resolveTipoEmpresa } from 'src/app/models/empresa/tipo-empresa.enum';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { AuthService } from 'src/app/services/auth.service';

export type CatalogoVersaoAdministrativa = 'LEGADO_DEPOSITO' | 'CATALOGO_NOVO';

export interface CatalogoEmpresaContext {
  tipoEmpresa: TipoEmpresa;
  versaoCatalogo: CatalogoVersaoAdministrativa;
  origem: 'EMPRESA' | 'PERMISSOES' | 'TIPO_EMPRESA';
}

const CATALOGO_PERMISSOES_BASE = [
  'CATALOGO_PRODUTOS_VER',
  'CATALOGO_CATEGORIAS_VER',
  'CATALOGO_MARCAS_VER',
  'CATALOGO_CARACTERISTICAS_VER',
];

@Injectable({ providedIn: 'root' })
export class CatalogoEmpresaContextService {
  private readonly contextSubject = new BehaviorSubject<CatalogoEmpresaContext>({
    tipoEmpresa: TipoEmpresa.GRAFICA,
    versaoCatalogo: 'LEGADO_DEPOSITO',
    origem: 'TIPO_EMPRESA',
  });

  readonly context$ = this.contextSubject.asObservable();

  constructor(private readonly authService: AuthService) {
    this.authService.usuario$.subscribe((usuario) => {
      this.contextSubject.next(this.resolveFromUsuario(usuario));
    });
  }

  resolveOnce(): Observable<CatalogoEmpresaContext> {
    return this.context$.pipe(
      filter(Boolean),
      take(1)
    );
  }

  snapshot(): CatalogoEmpresaContext {
    return this.contextSubject.value;
  }

  usaCatalogoNovo(): boolean {
    return this.snapshot().versaoCatalogo === 'CATALOGO_NOVO';
  }

  usaDepositoLegado(): boolean {
    return this.snapshot().versaoCatalogo === 'LEGADO_DEPOSITO';
  }

  versao$(): Observable<CatalogoVersaoAdministrativa> {
    return this.context$.pipe(map((context) => context.versaoCatalogo));
  }

  private resolveFromUsuario(usuario: Usuario | null): CatalogoEmpresaContext {
    const tipoEmpresa = resolveTipoEmpresa(usuario?.empresa?.tipoEmpresa);
    if (tipoEmpresa !== TipoEmpresa.DEPOSITO) {
      return { tipoEmpresa, versaoCatalogo: 'LEGADO_DEPOSITO', origem: 'TIPO_EMPRESA' };
    }

    const versaoEmpresa = this.getVersaoCatalogoFromEmpresa(usuario);
    if (versaoEmpresa) {
      return { tipoEmpresa, versaoCatalogo: versaoEmpresa, origem: 'EMPRESA' };
    }

    const permissoes = usuario?.perfil?.permissoes?.map((permissao) => permissao.chave).filter(Boolean) || [];
    const possuiPermissaoCatalogo = CATALOGO_PERMISSOES_BASE.some((permissao) => permissoes.includes(permissao));

    return {
      tipoEmpresa,
      versaoCatalogo: possuiPermissaoCatalogo ? 'CATALOGO_NOVO' : 'LEGADO_DEPOSITO',
      origem: 'PERMISSOES',
    };
  }

  private getVersaoCatalogoFromEmpresa(usuario: Usuario | null): CatalogoVersaoAdministrativa | null {
    const empresa = usuario?.empresa as any;
    const versao = empresa?.versaoCatalogo || empresa?.versao_catalogo || empresa?.configuracaoCatalogo?.versaoCatalogo;

    if (versao === 'CATALOGO_NOVO' || versao === 'LEGADO_DEPOSITO') {
      return versao;
    }

    return null;
  }
}
