import { SmartCalcItem } from "./smart-calc-item.model";

export interface SmartCalcResponse {

  itens: SmartCalcItem[];
  observacao?: string;
  total: number;
  
}