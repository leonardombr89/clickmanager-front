export type AplicativoSistema = 'CALCULADORA_REVESTIMENTO';

export interface AplicativoEmpresa {
  aplicativo: AplicativoSistema;
  ativo: boolean;
}

export interface AtalhoEmpresa {
  id?: number;
  nome: string;
  url: string;
  novaAba: boolean;
  ativo: boolean;
  ordem: number;
}

export interface ConfiguracaoAplicativos {
  aplicativos: AplicativoEmpresa[];
  atalhos: AtalhoEmpresa[];
}

export interface AplicativoCatalogo {
  aplicativo: AplicativoSistema;
  nome: string;
  descricao: string;
  icone: string;
  imagem: string;
  rota: string;
}

export const APLICATIVOS_CATALOGO: readonly AplicativoCatalogo[] = [
  {
    aplicativo: 'CALCULADORA_REVESTIMENTO',
    nome: 'Calculadora de revestimento',
    descricao: 'Caixas, ambientes e percentual de perda.',
    icone: 'calculator',
    imagem: 'assets/images/svgs/icon-connect.svg',
    rota: '/apps/calculadoras/pisos',
  },
] as const;
