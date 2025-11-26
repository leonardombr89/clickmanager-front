import { EntidadeBasica } from "../entidade-basica.model";
import { ProdutoOption } from "../produto/produto-option.model";

export interface CalculadoraConfigResponse {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  produtos: ProdutoOption[];
}