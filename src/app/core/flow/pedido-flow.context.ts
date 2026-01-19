import { FlowContext } from './pedido-flow.types';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';

export function mapPedidoToFlowContext(pedido: PedidoResponse | null): FlowContext {
  if (!pedido) {
    return {
      clienteId: null,
      itensCount: 0,
      valorTotal: 0,
      pagamentosTotal: 0,
      restaPagar: 0,
      orcamentoVencido: false,
      pagoPercent: 0,
      nomeOrcamento: '',
      vencimentoOrcamento: ''
    };
  }
  const pagamentosTotal = (pedido.pagamentos || []).reduce((acc, p: any) => acc + Number(p.valor || 0), 0);
  const vencimentoOrcamento = pedido.vencimentoOrcamento || null;
  const vencimentoDate = vencimentoOrcamento ? new Date(vencimentoOrcamento) : null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencido = !!vencimentoDate && vencimentoDate.getTime() < hoje.getTime();
  const orcamentoStatus = (pedido as any).orcamentoStatus || (pedido as any).orcamentoDetalhe?.status || null;
  const total = pedido.total ?? 0;
  const pagoPercent = total > 0 ? (pagamentosTotal / total) * 100 : 0;
  return {
    clienteId: pedido.cliente?.id ?? null,
    itensCount: pedido.itens?.length ?? 0,
    valorTotal: pedido.total ?? 0,
    pagamentosTotal,
    restaPagar: pedido.restaPagar ?? 0,
    orcamentoVencido: vencido,
    orcamentoStatus,
    pagoPercent,
    nomeOrcamento: pedido.nomeOrcamento ?? '',
    vencimentoOrcamento
  };
}
