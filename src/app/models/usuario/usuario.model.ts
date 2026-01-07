
import { Empresa } from "../empresa/empresa.model";
import { Endereco } from "../endereco/endereco.model";
import { Perfil } from "../perfil.model";

export interface Usuario {
  id?: number;
  nome?: string;
  username?: string;
  perfil?: Perfil;
  ativo?: boolean;
  fotoPerfil?: string | null;
  fotoPerfilUrl?: string | null;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  empresa?: Empresa;
  proprietario?: boolean;
}

  
