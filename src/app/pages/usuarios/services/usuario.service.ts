import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Usuario } from 'src/app/models/usuario/usuario.model';
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

  listarVinculaveis(search: string, size: number = 20): Observable<Usuario[]> {
    const termo = (search || '').trim();
    const limite = Math.max(1, Math.min(size || 20, 50));
    const url = `api/pessoas/usuarios-vinculaveis?search=${encodeURIComponent(termo)}&size=${limite}`;
    return this.api.get<Usuario[] | { content?: Usuario[] }>(url).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.content)) return res.content;
        return [];
      })
    );
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
