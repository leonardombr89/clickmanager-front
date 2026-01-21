import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { Empresa } from 'src/app/models/empresa/empresa.model';
import { displayNumero, getDocTitulo, isOrcamento, isOrcamentoVencido, statusBadgeClass, statusDescricao, validadeOrcamento } from '../../../shared/imprimir-utils';

@Component({
  selector: 'app-imprimir-pedido-duas-vias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-pedido-duas-vias.component.html',
  styleUrls: ['./imprimir-pedido-duas-vias.component.scss']
})
export class ImprimirPedidoDuasViasComponent {
  @Input({ required: true }) pedido!: PedidoResponse;
  @Input() empresa: Empresa | null = null;

  displayNumero = displayNumero;
  getDocTitulo = getDocTitulo;
  isOrcamento = isOrcamento;
  isOrcamentoVencido = isOrcamentoVencido;
  validadeOrcamento = validadeOrcamento;
  statusBadgeClass = statusBadgeClass;
  statusDescricao = statusDescricao;

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
}
