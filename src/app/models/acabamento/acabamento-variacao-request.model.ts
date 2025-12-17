
import { PrecoRequest } from '../preco/preco.model';
import { TipoAplicacaoAcabamento } from './tipo-aplicacao-acabamento.enum';

export interface AcabamentoVariacaoRequest {
  id?: number;                 
  formatoId?: number | null;   
  materialId?: number | null; 
  preco: PrecoRequest;
  tipoAplicacao: TipoAplicacaoAcabamento;
  ativo?: boolean;
}
