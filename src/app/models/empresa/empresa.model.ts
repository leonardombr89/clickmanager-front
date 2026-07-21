import { Endereco } from "../endereco/endereco.model";
import { TipoEmpresa } from "./tipo-empresa.enum";


export interface Empresa {
    id?: number;
    nome?: string;
    slug?: string | null;
    telefone?: string;
    email?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    horario?: string;
    logoUrl?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    siteUrl?: string | null;
    youtubeUrl?: string | null;
    tipoEmpresa?: TipoEmpresa | null;
    versaoCatalogo?: 'LEGADO_DEPOSITO' | 'CATALOGO_NOVO' | null;
    dataCriacao?: string;
    ativa?: boolean;
    endereco?: Endereco;
    onboardingIgnorado?: boolean;
  }
