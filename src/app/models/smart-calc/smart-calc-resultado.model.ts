import { SmartCalcItem } from './smart-calc-item.model';

export interface SmartCalcResultado {
    itens: SmartCalcItem[];
    observacao?: string;
    total: number;
}
