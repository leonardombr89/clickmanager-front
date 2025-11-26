export interface ColunaDef {
    coluna: string;
    titulo: string;
    template?: string;
  }
  
  export interface AcaoBotao {
    icone: string;
    tooltip: string;
    cor?: string;
    permissao?: string;
    acao: (element: any) => void;
  }
  