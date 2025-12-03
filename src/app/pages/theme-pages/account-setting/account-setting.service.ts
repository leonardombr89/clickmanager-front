import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { ApiService } from 'src/app/services/api.service';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AccountSettingService {
  constructor(private api: ApiService) {}

  salvarDadosUsuario(formData: FormData): Observable<any> {
    return this.api.post('/api/usuarios', formData);
  }

  atualizarDadosUsuario(id: string, formData: FormData): Observable<any> {
    return this.api.put(`api/usuarios/${id}`, formData);
  }

  buscarEndereco(cep: string): Observable<any> {
    return this.api.buscarEnderecoPorCep(cep);
  }

  buscarUsuarioPorId(id: string): Observable<Usuario> {
    return this.api.get<Usuario>(`api/usuarios/${id}`);
  }  

}
