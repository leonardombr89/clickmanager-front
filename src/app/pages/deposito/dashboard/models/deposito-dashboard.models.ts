export type DepositoDashboardOrcamentoStatus =
  | 'NOVO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO_CLIENTE'
  | 'CONVERTIDO'
  | 'PERDIDO'
  | string;

export interface DepositoDashboardCatalogo {
  totalItens: number;
  itensAtivos: number;
  itensInativos: number;
  itensSemImagem: number;
  itensSemCategoria: number;
  itensDestaque: number;
  totalCategorias: number;
  categoriasAtivas: number;
  categoriasInativas: number;
  totalMarcas: number;
  marcasAtivas: number;
  marcasInativas: number;
}

export interface DepositoDashboardOrcamentoResumo {
  ativoNoSite: boolean;
  total: number;
  novos: number;
  novosHoje: number;
  emAtendimento: number;
  aguardandoCliente: number;
  convertidos: number;
  perdidos: number;
}

export interface DepositoDashboardOrcamentoRecente {
  id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  quantidadeItens: number;
  status: DepositoDashboardOrcamentoStatus;
  criadoEm: string;
  atualizadoEm?: string | null;
}

export interface DepositoDashboardResponse {
  catalogo: DepositoDashboardCatalogo;
  orcamentos: DepositoDashboardOrcamentoResumo;
  orcamentosRecentes: DepositoDashboardOrcamentoRecente[];
}
