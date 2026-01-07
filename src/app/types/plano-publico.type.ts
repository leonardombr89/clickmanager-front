export interface PlanoPublico {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  periodicidade?: string;
  preco_centavos?: number;
  moeda?: string;
  ativo?: boolean;
  ordem_exibicao?: number;
  limites_json?: string;
  beneficios_json?: string[] | string;
  mercado_pago_plan_id?: string;
  imgSrc?: string;
  popular?: boolean;
}
