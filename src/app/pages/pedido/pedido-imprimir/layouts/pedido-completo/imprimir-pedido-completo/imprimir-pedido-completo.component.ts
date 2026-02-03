import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { Empresa } from 'src/app/models/empresa/empresa.model';
import { displayNumero, getDocTitulo, isOrcamento, isOrcamentoVencido, statusBadgeClass, statusDescricao, validadeOrcamento } from '../../../shared/imprimir-utils';

@Component({
  selector: 'app-imprimir-pedido-completo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-pedido-completo.component.html',
  styleUrls: ['./imprimir-pedido-completo.component.scss']
})
export class ImprimirPedidoCompletoComponent {
  @Input({ required: true }) pedido!: PedidoResponse;
  @Input() empresa: Empresa | null = null;
  agora = new Date();

  displayNumero = displayNumero;
  getDocTitulo = getDocTitulo;
  isOrcamento = isOrcamento;
  isOrcamentoVencido = isOrcamentoVencido;
  validadeOrcamento = validadeOrcamento;
  statusBadgeClass = statusBadgeClass;
  statusDescricao = statusDescricao;

  get validadeOrcamentoDate(): Date | null {
    if ((this.pedido.status || '').toUpperCase() !== 'ORCAMENTO') return null;
    const raw = (this.pedido as any).vencimentoOrcamento || this.validadeOrcamento(this.pedido);
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === 'string') {
      // tenta ISO / yyyy-MM-dd
      const iso = new Date(raw);
      if (!isNaN(iso.getTime())) return iso;
      const parts = raw.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        return isNaN(dt.getTime()) ? null : dt;
      }
    }
    return null;
  }

  formatEnderecoEmpresa(): string {
    if (!this.empresa?.endereco) return '';
    const e = this.empresa.endereco;
    const partes = [
      e.logradouro,
      e.numero,
      e.bairro,
      e.cidade ? `${e.cidade}${e.estado ? '/' + e.estado : ''}` : undefined
    ].filter(Boolean);
    return partes.join(', ');
  }

  get nomeCliente(): string {
    const p: any = this.pedido;
    return p?.cliente?.nome || p?.nomeCliente || p?.clienteNome || '—';
  }

  get enderecoCliente(): string {
    const p: any = this.pedido;
    const e = p?.cliente?.endereco;
    const montado = this.formatEnderecoGenerico(e);
    return montado || p?.clienteEndereco || p?.enderecoCliente || '—';
  }

  private formatEnderecoGenerico(e: any): string {
    if (!e) return '';
    const partes = [
      [e.logradouro, e.numero].filter(Boolean).join(' ').trim(),
      e.bairro,
      e.cidade || e.estado ? `${e.cidade || ''}${e.estado ? '/' + e.estado : ''}` : undefined,
      e.cep ? `CEP: ${e.cep}` : undefined
    ].filter(Boolean);
    return partes.join(', ');
  }

  trackByItem = (_: number, item: any) => item?.id ?? item?.descricao ?? _;

  formatEnderecoCliente(): string {
    const e = (this.pedido as any)?.cliente?.endereco;
    if (!e) return '';
    const partes = [
      [e.logradouro, e.numero].filter(Boolean).join(' ').trim(),
      e.bairro,
      e.cidade || e.estado ? `${e.cidade || ''}${e.estado ? '/' + e.estado : ''}` : undefined,
      e.cep ? `CEP: ${e.cep}` : undefined
    ].filter(Boolean);
    return partes.join(', ');
  }
}
