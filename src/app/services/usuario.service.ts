import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { Usuario } from "../models/usuario/usuario.model";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  buscarPorId(id: number): Observable<Usuario> {
    return this.api.get<Usuario>(`api/usuarios/${id}`);
  }

}

