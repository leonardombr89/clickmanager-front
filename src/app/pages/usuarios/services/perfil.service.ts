import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Perfil } from 'src/app/models/perfil.model';
import { PerfilRequest } from 'src/app/models/perfil/perfil-request.model';
import { Permissao } from 'src/app/models/permissao.model';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { ApiService } from 'src/app/services/api.service';


@Injectable({ providedIn: 'root' })
export class PerfilService {
  
  private readonly endpoint = 'api/perfis';

  constructor(private api: ApiService) {}

  listar(): Observable<Perfil[]> {
    return this.api.get<Perfil[]>(this.endpoint);
  }

  obter(id: number): Observable<Perfil> {
    return this.api.get<Perfil>(`${this.endpoint}/${id}`);
  }

  listarPermissoes(): Observable<Permissao[]> {
    return this.api.get<Permissao[]>('api/permissoes');
  }

  salvar(perfil: PerfilRequest): Observable<Perfil> {
    return this.api.post<Perfil>(this.endpoint, perfil);
  }

  atualizar(id: number, perfil: PerfilRequest): Observable<Perfil> {
    return this.api.put<Perfil>(`${this.endpoint}/${id}`, perfil);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  listarUsuariosDoPerfil(perfilId: number): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(`${this.endpoint}/${perfilId}/usuarios`);
  }

  trocarPerfil(usuarioId: number, perfilId: number): Observable<Usuario> {
    return this.api.put<Usuario>(`api/usuarios/${usuarioId}/perfil`, { perfilId });
  }
}
