import { EntidadeBasica } from "../entidade-basica.model";

export interface CalculadoraConfigResponse {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  materiais: EntidadeBasica[];
  acabamentos: EntidadeBasica[];
  servicos: EntidadeBasica[];
  formatos: EntidadeBasica[];
  ativo: boolean;
}