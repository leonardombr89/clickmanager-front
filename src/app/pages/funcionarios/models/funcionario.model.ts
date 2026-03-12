export type StatusFuncionario = 'ATIVO' | 'AFASTADO' | 'DESLIGADO';
export type TipoContrato = 'CLT' | 'PJ' | 'ESTAGIO' | 'TEMPORARIO' | 'SEM_REGISTRO';

export interface DocumentoFuncionario {
  id: number;
  tipo: string;
  numero: string;
  validade?: string | null;
}

export interface HistoricoValorFuncionario {
  id: number;
  valor: number;
  inicio: string;
  fim?: string | null;
  motivo?: string;
}

export interface MovimentacaoFuncionario {
  id: number;
  tipo: 'ADMISSAO' | 'ALTERACAO' | 'AFASTAMENTO' | 'DESLIGAMENTO';
  data: string;
  descricao: string;
  detalhes?: string[];
  snapshot?: {
    cargo: string;
    setor: string;
    status: StatusFuncionario;
    tipoContrato: TipoContrato;
    salario?: number | null;
    valorPassagem?: number | null;
    endereco?: string;
  };
}

export interface Funcionario {
  id: number;
  usuarioId?: number | null;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  dataAdmissao: string;
  tipoContrato: TipoContrato;
  status: StatusFuncionario;
  salarioBase?: number | null;
  salario?: number | null;
  valorPassagem?: number | null;
  endereco?: string;
  historicoSalario: HistoricoValorFuncionario[];
  historicoPassagem: HistoricoValorFuncionario[];
  documentos: DocumentoFuncionario[];
  movimentacoes: MovimentacaoFuncionario[];
}

export interface FuncionarioFormValue {
  usuarioId?: number | null;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  dataAdmissao: string;
  tipoContrato: TipoContrato;
  status: StatusFuncionario;
  salarioBase?: number | null;
  salario?: number | null;
  valorPassagem?: number | null;
  endereco?: string;
}
