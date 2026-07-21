export interface CalculadoraPisoProduto {
  id: number;
  codigo: string;
  nome: string;
  categoria?: string | null;
  marca?: string | null;
  unidadeVenda?: string | null;
  imagemUrl?: string | null;
  metragemPorEmbalagem?: number | null;
  precoUnitario?: number | null;
  perdaPadraoPercentual?: number | null;
  ativo?: boolean | null;
  configurado?: boolean | null;
}

export interface CalculadoraPisoAmbienteRequest {
  nome: string;
  largura: number;
  comprimento: number;
  quantidade: number;
}

export interface CalculadoraPisoRequest {
  produtoId: number;
  percentualPerda: number;
  ambientes: CalculadoraPisoAmbienteRequest[];
}

export interface CalculadoraPisoAmbienteResultado extends CalculadoraPisoAmbienteRequest {
  area: number;
}

export interface CalculadoraPisoResultado {
  produto: CalculadoraPisoProduto;
  ambientes: CalculadoraPisoAmbienteResultado[];
  areaTotal: number;
  percentualPerda: number;
  areaPerda: number;
  areaNecessaria: number;
  quantidadeCaixas: number;
  areaComprada: number;
  sobraEstimada: number;
  valorUnitario?: number | null;
  valorTotal?: number | null;
  avisos?: string[];
}

export interface CalculadoraPisoAdicionarOrcamentoRequest {
  orcamentoId?: number | null;
  criarNovoOrcamento?: boolean;
  resultado: CalculadoraPisoResultado;
}

export interface CalculadoraPisoAdicionarOrcamentoResponse {
  pedidoId: number;
  itemId?: number | null;
  mensagem?: string | null;
}
