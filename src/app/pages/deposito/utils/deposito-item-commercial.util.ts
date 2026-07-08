import { DepositoItem, DepositoUnidadeVenda } from '../models/deposito.models';

const PRECO_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const UNIDADE_VENDA_LABELS: Record<DepositoUnidadeVenda, string> = {
  UNIDADE: 'Unidade',
  METRO: 'Metro',
  METRO_QUADRADO: 'Metro quadrado',
  CAIXA: 'Caixa',
  PACOTE: 'Pacote',
  SACO: 'Saco',
  LITRO: 'Litro',
  KG: 'Kg',
};

export function formatarPreco(valor?: number | null): string {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return '—';
  }

  return PRECO_FORMATTER.format(Number(valor));
}

export function formatarUnidadeVenda(unidade?: DepositoUnidadeVenda | null): string {
  if (!unidade) {
    return '—';
  }

  return UNIDADE_VENDA_LABELS[unidade] || unidade;
}

export function getPrecoExibicao(item: Pick<DepositoItem, 'sobConsulta' | 'exibirPreco' | 'precoVenda' | 'precoPromocional'>): string {
  if (item.sobConsulta) {
    return 'Sob consulta';
  }

  if (item.exibirPreco === false) {
    return 'Preço oculto';
  }

  if (item.precoPromocional !== null && item.precoPromocional !== undefined) {
    return formatarPreco(item.precoPromocional);
  }

  return formatarPreco(item.precoVenda);
}
