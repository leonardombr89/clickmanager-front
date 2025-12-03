import { Usuario } from "../usuario/usuario.model";
import { Empresa } from "./empresa.model";

export interface EmpresaComUsuarioCreateRequest {
  empresa: Empresa;
  usuario: Usuario;
}