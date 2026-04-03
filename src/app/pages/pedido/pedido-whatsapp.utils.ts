import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';

function formatMoney(value?: number): string {
  const amount = typeof value === 'number' ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

export function displayPedidoNumero(pedido: PedidoResponse): string {
  return pedido.numeroOrcamento?.trim() || pedido.numero?.trim() || '—';
}

export function toE164BR(raw: string): string {
  if (!raw) return '';

  let digits = raw.replace(/\D+/g, '');

  if (digits.startsWith('55')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length === 13 && digits.startsWith('550')) {
    return `55${digits.slice(2)}`;
  }

  if (!digits.startsWith('55')) {
    digits = `55${digits}`;
  }

  return digits;
}

export function buildPedidoWhatsAppPreviewMessage(pedido: PedidoResponse, empresaNome = ''): string {
  const numero = displayPedidoNumero(pedido);
  const lineTitle = empresaNome ? `*ORCAMENTO ${empresaNome}*` : `*ORCAMENTO*`;
  const linePedido = `\n\n📦 *PEDIDO: ${numero}*`;
  const cliente = pedido.cliente?.nome ? `\n\n👤 *Cliente:* ${pedido.cliente.nome}` : '';
  const atendente = pedido.responsavel?.nome ? `\n🧑‍💼 *Atendido por:* ${pedido.responsavel.nome}` : '';
  const data = pedido.dataCriacao ? `\n🗓️ *Data:* ${new Date(pedido.dataCriacao).toLocaleString('pt-BR')}` : '';

  const itensHeader = `\n\n📦 *Itens*`;
  const itens = '\n' + (pedido.itens || []).map(item => {
    const qtd = item.quantidade ?? 0;
    const unit = formatMoney(item.valor ?? 0);
    const sub = formatMoney(item.subTotal ?? 0);
    return `- ${item.descricao} — *${qtd}× ${unit} = ${sub}*`;
  }).join('\n');

  const subtotal = `\n\n➕ *Subtotal:* ${formatMoney(pedido.subTotal)}`;
  const ajustes = `\n🚚 *Frete:* ${formatMoney(pedido.frete)}  |  🔼 *Acrésc.:* ${formatMoney(pedido.acrescimo)}  |  🔽 *Desc.:* ${formatMoney(pedido.desconto)}`;
  const total = `\n\n💰 *TOTAL:* *${formatMoney(pedido.total)}*`;
  const footer = `\n\n🙌 Obrigado pela preferência! Qualquer dúvida, estamos à disposição.`;

  return [
    lineTitle,
    linePedido,
    cliente,
    atendente,
    data,
    itensHeader,
    itens || '* (sem itens)*',
    subtotal,
    ajustes,
    total,
    footer
  ].join('');
}

export function buildPedidoWhatsAppSendMessage(pedido: PedidoResponse, empresaNome = ''): string {
  const numero = displayPedidoNumero(pedido);
  const title = empresaNome ? `*ORCAMENTO ${empresaNome}*` : `*ORCAMENTO*`;

  const header = [
    '',
    `\n\n*PEDIDO: ${numero}*`,
    pedido.cliente?.nome ? `\n*Cliente:* ${pedido.cliente.nome}` : '',
    pedido.responsavel?.nome ? `\n*Atendido por:* ${pedido.responsavel.nome}` : '',
    pedido.dataCriacao ? `\n*Data:* ${new Date(pedido.dataCriacao).toLocaleString('pt-BR')}` : ''
  ].join('');

  const itensHeader = `\n\n*Itens*`;
  const itens = '\n' + (pedido.itens || []).map(item => {
    const qtd = item.quantidade ?? 0;
    const unit = formatMoney(item.valor ?? 0);
    const sub = formatMoney(item.subTotal ?? 0);
    return `- ${item.descricao} — *${qtd}× ${unit} = ${sub}*`;
  }).join('\n');

  const totals = [
    `\n\n*Subtotal:* ${formatMoney(pedido.subTotal)}`,
    `\n*Frete:* ${formatMoney(pedido.frete)}  |  *Acrésc.:* ${formatMoney(pedido.acrescimo)}  |  *Desc.:* ${formatMoney(pedido.desconto)}`,
    `\n\n*TOTAL:* *${formatMoney(pedido.total)}*`
  ].join('');

  const footer = `\n\nObrigado pela preferência! Qualquer dúvida, estamos à disposição.`;

  return [
    title,
    header,
    itensHeader,
    itens || '* (sem itens)*',
    totals,
    footer
  ].join('');
}
