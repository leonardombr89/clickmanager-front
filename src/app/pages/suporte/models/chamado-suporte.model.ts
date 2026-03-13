export type ChamadoSuporteStatus =
  | 'ABERTO'
  | 'EM_ANALISE'
  | 'AGUARDANDO_CLIENTE'
  | 'RESPONDIDO'
  | 'RESOLVIDO'
  | 'FECHADO';

export type ChamadoSuporteCategoria =
  | 'DUVIDA'
  | 'ERRO'
  | 'FINANCEIRO'
  | 'SUGESTAO'
  | 'ACESSO'
  | 'OUTRO';

export type ChamadoSuportePrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface MensagemChamadoSuporte {
  id: number;
  autorUsuarioId: number | null;
  autorNome: string;
  autorTipo: 'CLIENTE' | 'SUPORTE' | string;
  mensagem: string;
  interna: boolean;
  criadaEm: string;
}

export interface ChamadoSuporteListaItem {
  id: number;
  assunto: string;
  categoria: ChamadoSuporteCategoria;
  prioridade: ChamadoSuportePrioridade;
  status: ChamadoSuporteStatus;
  criadoEm: string;
  atualizadoEm: string;
  fechadoEm: string | null;
}

export interface ChamadoSuporteDetalhe extends ChamadoSuporteListaItem {
  usuarioSolicitanteId: number;
  usuarioSolicitanteNome: string;
  mensagens: MensagemChamadoSuporte[];
}

export interface ChamadoSuportePaginadoResponse {
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  itens: ChamadoSuporteListaItem[];
}

export interface CriarChamadoSuporteRequest {
  assunto: string;
  categoria: ChamadoSuporteCategoria;
  prioridade: ChamadoSuportePrioridade;
  mensagem: string;
}

export interface ResponderChamadoSuporteRequest {
  mensagem: string;
}
