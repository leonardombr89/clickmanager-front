// src/app/models/smart-calc/smart-calc-init.model.ts

/**
 * Resposta principal do init da SmartCalc
 * Corresponde a SmartCalcInitResponse (backend)
 */
export interface SmartCalcInitResponse {
  ativo: boolean;
  produtos: ProdutoSmartCalcInitResponse[];
}

/**
 * Produto disponível na SmartCalc
 * Corresponde a ProdutoSmartCalcInitResponse (backend)
 */
export interface ProdutoSmartCalcInitResponse {
  id: number;
  nome: string;
  variacoes: ProdutoVariacaoSmartCalcInitResponse[];
}

/**
 * Variação do produto usada no SmartCalc
 * Cada variação possui:
 * - 1 material
 * - N acabamentos
 * - N serviços
 */
export interface ProdutoVariacaoSmartCalcInitResponse {
  id: number;
  material: IdNomeResponse;
  acabamentos: IdNomeResponse[];
  servicos: IdNomeResponse[];
}

/**
 * Modelo simples reutilizável (id + nome)
 * Usado por material, acabamento e serviço
 * Corresponde aos *ResumeResponse do backend
 */
export interface IdNomeResponse {
  id: number;
  nome: string;
}
