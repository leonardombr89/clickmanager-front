import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario.model';
import { ApiService } from 'src/app/services/api.service';

export interface Perfil {
  id?: number;
  nome: string;
  descricao?: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly endpoint = '/api/perfis';

  constructor(private api: ApiService) {}

  listar(): Observable<Perfil[]> {
    return this.api.get<Perfil[]>(this.endpoint);
  }

  salvar(perfil: Perfil): Observable<Perfil> {
    return this.api.post<Perfil>(this.endpoint, perfil);
  }

  atualizar(id: number, perfil: Perfil): Observable<Perfil> {
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
