import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { Usuario } from '../models/usuario/usuario.model';
import { ToastrService } from 'ngx-toastr';
import { decodeToken } from '../utils/token.util';
import { JwtPayload } from '../pages/authentication/jwt-payload.interface';
import { NgxPermissionsService } from 'ngx-permissions';
import { UsuarioService } from './usuario.service';
import { AuthTokenStorageService } from './auth-token-storage.service';
import { AuthApiService } from './auth-api.service';
import { AuthTokens } from '../models/auth-tokens.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private jwtPayload: JwtPayload | null = null;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private permissionsService: NgxPermissionsService,
    private usuarioService: UsuarioService,
    private authApi: AuthApiService,
    private tokenStorage: AuthTokenStorageService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.initJwt();
  }

  login(username: string, password: string, lembrar = false): Observable<Usuario> {
    lembrar ? this.tokenStorage.usarLocalStorage() : this.tokenStorage.usarSessionStorage();
  
    return this.authApi.login(username, password).pipe(
      tap(tokens => this.persistirTokens(tokens)),
      switchMap(() => this.carregarUsuarioCompleto())
    );
  }

  private initJwt(): void {
    const token = this.tokenStorage.getToken();
    if (!token) return;

    this.jwtPayload = decodeToken(token);
  }

  public carregarUsuarioCompleto(): Observable<Usuario> {
    const id = this.jwtPayload?.id;
    if (!id) return throwError(() => new Error('Token inválido'));
  
    return this.usuarioService.buscarPorId(id).pipe(
      tap(usuario => {
        this.carregarPermissoes(usuario);
        this.usuarioSubject.next(usuario);
      }),
      catchError(err => {
        this.toastr.error('Erro ao carregar dados do usuário');
        return throwError(() => err);
      })
    );
  }

  private carregarPermissoes(usuario: Usuario): void {
    const perfil = usuario.perfil;
    if (!perfil || !Array.isArray(perfil.permissoes)) return;

    const permissoesChave = perfil.permissoes
      .map(p => p?.chave)
      .filter((chave): chave is string => typeof chave === 'string');

    this.permissionsService.loadPermissions(permissoesChave);
  }

  logout(): void {
    this.tokenStorage.limparTokens();
    this.jwtPayload = null;
    this.usuarioSubject.next(null);
    this.permissionsService.flushPermissions();
    this.toastr.info('Você saiu do sistema.');
    setTimeout(() => this.router.navigateByUrl('/authentication/login'), 200);
  }

  temPermissao(permissao: string): boolean {
    const permissoes = this.permissionsService.getPermissions();
    return Object.prototype.hasOwnProperty.call(permissoes, permissao);
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }

  getUsuario(): Usuario {
    const usuario = this.usuarioSubject.value;
    if (!usuario) throw new Error('Usuário não autenticado');
    return usuario;
  }

  getUsuarioNome(): string | null {
    return this.usuarioSubject.value?.nome || null;
  }

  getJwtPayload(): JwtPayload | null {
    return this.jwtPayload;
  }

  getJwtId(): number | null {
    return this.jwtPayload?.id || null;
  }

  getToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  register(username: string, senha: string, nome: string): Observable<any> {
    return this.authApi.register(username, senha, nome);
  }

  recuperarSenha(email: string): Observable<void> {
    return this.authApi.recuperarSenha(email);
  }

  resetarSenha(token: string, novaSenha: string): Observable<void> {
    return this.authApi.resetarSenha(token, novaSenha);
  }

  verificarSeTemUsuarios(): Observable<boolean> {
    return this.authApi.verificarSeTemUsuarios();
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token ausente'));
    }

    return this.authApi.refreshToken(refreshToken).pipe(tap(tokens => this.persistirTokens(tokens)));
  }

  isAccessTokenExpired(token: string): boolean {
    try {
      const payload = decodeToken(token);
      if (!payload?.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  hasValidRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const payload = decodeToken(refreshToken);
      if (!payload?.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      // Se o refresh token não for JWT, considere-o válido e deixe o backend decidir.
      return true;
    }
  }

  private persistirTokens(tokens: AuthTokens): void {
    this.tokenStorage.salvarTokens(tokens.accessToken, tokens.refreshToken);
    this.jwtPayload = decodeToken(tokens.accessToken);
  }
}
