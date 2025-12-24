import { of, Observable } from 'rxjs';

export enum TipoAplicacaoAcabamento {
  POR_PECA = 'POR_PECA',
  POR_FOLHA = 'POR_FOLHA',
  POR_METRO_QUADRADO = 'POR_METRO_QUADRADO',
  POR_METRO_LINEAR = 'POR_METRO_LINEAR',
  POR_SERVICO = 'POR_SERVICO',
}

export namespace TipoAplicacaoAcabamento {
  export interface Option {
    value: TipoAplicacaoAcabamento;
    label: string;
  }

  const OPTIONS: Option[] = [
    { value: TipoAplicacaoAcabamento.POR_PECA,           label: 'Por peça' },
    { value: TipoAplicacaoAcabamento.POR_FOLHA,          label: 'Por folha' },
    { value: TipoAplicacaoAcabamento.POR_METRO_QUADRADO, label: 'Por metro quadrado' },
    { value: TipoAplicacaoAcabamento.POR_METRO_LINEAR,   label: 'Por metro linear' },
    { value: TipoAplicacaoAcabamento.POR_SERVICO,        label: 'Por serviço' },
  ];

  export function options(): Option[] {
    return [...OPTIONS];
  }

  export function buscar(filtro: string): Option[] {
    const f = (filtro ?? '').toLowerCase();
    if (!f) return options();

    return OPTIONS.filter(o =>
      o.label.toLowerCase().includes(f) ||
      o.value.toLowerCase().includes(f)
    );
  }

  export function label(
    value: Option | TipoAplicacaoAcabamento | string | null | undefined
  ): string {
    if (!value) return '';

    // se já for Option
    if ((value as Option).label && (value as Option).value) {
      return (value as Option).label;
    }

    const v = typeof value === 'string'
      ? value
      : (value as Option).value;

    const found = OPTIONS.find(o => o.value === v);
    return found?.label ?? String(v);
  }

  export function toValue(
    value: Option | TipoAplicacaoAcabamento | string | null | undefined
  ): TipoAplicacaoAcabamento | null {
    if (!value) return null;

    // se já for Option
    if ((value as Option).value) {
      return (value as Option).value;
    }

    const v = String(value).toUpperCase() as TipoAplicacaoAcabamento;
    return Object.values(TipoAplicacaoAcabamento).includes(v)
      ? v
      : null;
  }
}
