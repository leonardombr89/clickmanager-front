export interface Permissao {
  id: number;
  chave: string;
  titulo: string;
  descricao?: string | null;
  modulo?: ModuloPermissao | null;
  recurso?: string | null;
  recursoTitulo?: string | null;
  acao?: string | null;
  ordem?: number | null;
  selecionada?: boolean;
}

export interface ModuloPermissao {
  codigo: string;
  titulo: string;
  ordem?: number | null;
}

export type PermissaoCatalogo = Permissao;

export interface PermissaoAcao {
  id: number;
  chave: string;
  titulo: string;
  descricao?: string | null;
  acao: string;
  ordem?: number | null;
  selecionada?: boolean;
}
