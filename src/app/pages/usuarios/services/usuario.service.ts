import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario.model';
import { ApiService } from 'src/app/services/api.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly endpoint = 'api/usuarios';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, ativo?: boolean | null): Observable<any> {
    let url = `api/usuarios?page=${page}&size=${size}`;
  
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
  
    return this.api.get<any>(url);
  }
  

  buscarPorId(id: number): Observable<Usuario> {
    return this.api.get<Usuario>(`${this.endpoint}/${id}`);
  }

  salvar(usuario: Usuario): Observable<Usuario> {
    return this.api.post<Usuario>(this.endpoint, usuario);
  }

  atualizar(id: number, formData: FormData): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, formData);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
