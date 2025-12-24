
import { Preco } from '../preco/preco-response.model';
import { TipoAplicacaoAcabamento } from './tipo-aplicacao-acabamento.enum';

export interface AcabamentoVariacaoResponse {
  id: number;

  // dados do acabamento
  acabamentoId: number;
  nome: string;
  descricao: string | null;

  // vínculos (opcional, mas ajuda)
  formatoId: number | null;
  formatoNome?: string | null;
  materialId: number | null;
  materialNome?: string | null;

  // agora o preço fica aqui
  preco: Preco;

  tipoAplicacao: string; // enum no back, string no front
  ativo: boolean;
}
