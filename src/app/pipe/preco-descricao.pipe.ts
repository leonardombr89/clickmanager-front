import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'precoDescricao',
  standalone: true
})
export class PrecoDescricaoPipe implements PipeTransform {
  transform(produto: any): string {
    if (!produto?.preco || !produto.preco.tipo) return '';

    const preco = produto.preco;
    const politica = produto.politicaRevenda;
    let descricao = '';

    switch (preco.tipo) {
      case 'FIXO':
        descricao = this.formatarMoeda(preco.valor);
        break;

      case 'QUANTIDADE':
        descricao = preco.faixas
          ?.map((faixa: any) => `${faixa.quantidade} = ${this.formatarMoeda(faixa.valor)}`)
          .join('\n');
        break;

      case 'DEMANDA':
        descricao = preco.faixas
          ?.map((faixa: any) => `${faixa.de}un. - ${faixa.ate}un. = ${this.formatarMoeda(faixa.valorUnitario)}`)
          .join('\n');
        break;

        case 'METRO':
            const unidade = preco.modoCobranca === 'LINEAR' ? 'M' : 'M²';
            descricao = `R$ ${this.formatarMoeda(preco.precoMetro)} por ${unidade}\nMínimo: ${this.formatarMoeda(preco.precoMinimo)}`;
            break;          

      default:
        descricao = preco.tipo;
    }

    const revenda = this.formatarRevenda(politica);
    return revenda ? `${descricao}\n----------\n${revenda}` : descricao;
  }

  private formatarMoeda(valor: number): string {
    return valor?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }) ?? '';
  }

  private formatarRevenda(politica: any): string {
    if (!politica) return '';

    if (politica.percentual) {
      return `Revendedor: -${politica.percentualDesconto ?? 0}%`;
    }

    if (politica.precoFixo != null) {
      return `Revendedor: ${this.formatarMoeda(politica.precoFixo)}`;
    }

    return '';
  }
}
