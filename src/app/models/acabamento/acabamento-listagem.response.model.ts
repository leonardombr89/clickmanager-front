export interface AcabamentoListResponse {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  variacoes: string[];
}