export interface SmartCalcRequest {

    produtoId: number;
    materialId?: number | null;
    largura: number;
    altura: number;
    quantidade: number;
    servicosIds: number[];
    acabamentosIds: number[];
}