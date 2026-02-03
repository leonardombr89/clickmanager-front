import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';

export function isOrcamento(p?: PedidoResponse | null): boolean {
  return (p?.status || '').toUpperCase() === 'ORCAMENTO';
}

export function displayNumero(p?: PedidoResponse | null): string {
  if (!p) return '—';
  const num = isOrcamento(p) ? (p as any).numeroOrcamento : p.numero;
  return num ?? '—';
}

export function getDocTitulo(p?: PedidoResponse | null): 'Orçamento' | 'Pedido' {
  return isOrcamento(p) ? 'Orçamento' : 'Pedido';
}

export function validadeOrcamento(p?: PedidoResponse | null): Date | null {
  if (!isOrcamento(p) || !p?.vencimentoOrcamento) return null;
  return new Date(p.vencimentoOrcamento);
}

export function isOrcamentoVencido(p?: PedidoResponse | null): boolean {
  const v = validadeOrcamento(p);
  if (!v) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  v.setHours(0, 0, 0, 0);
  return v.getTime() < hoje.getTime();
}

export function statusBadgeClass(status?: string): string {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'RASCUNHO': return 'badge--rascunho';
    case 'ORCAMENTO': return 'badge--orcamento';
    case 'AGUARDANDO_PAGAMENTO': return 'badge--pagamento';
    case 'PENDENTE': return 'badge--pendente';
    case 'EM_PRODUCAO': return 'badge--producao';
    case 'PRONTO': return 'badge--pronto';
    case 'ENTREGUE': return 'badge--entregue';
    case 'CANCELADO': return 'badge--cancelado';
    default: return 'badge--default';
  }
}

export function statusDescricao(status?: string): string {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'RASCUNHO': return 'Rascunho em edição';
    case 'ORCAMENTO': return 'Aguardando aprovação do cliente';
    case 'AGUARDANDO_PAGAMENTO': return 'Pagamento pendente';
    case 'PENDENTE': return 'Pedido criado';
    case 'EM_PRODUCAO': return 'Produção em andamento';
    case 'PRONTO': return 'Pronto para entrega/retirada';
    case 'ENTREGUE': return 'Pedido entregue';
    case 'CANCELADO': return 'Pedido cancelado';
    default: return s || '—';
  }
}
