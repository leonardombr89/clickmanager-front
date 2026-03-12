import { Injectable } from '@angular/core';
import { HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  FolhaConfiguracaoEmpresa,
  FolhaAcordo,
  FolhaAcordoParcela,
  FolhaCompetencia,
  FolhaFuncionario,
  FolhaLancamento,
  FolhaPagamento,
  FolhaStatus,
  LancamentoTipo,
  PagamentoForma
} from '../models/folha.model';
import { CriarAcordoDialogResult } from '../components/dialog-criar-acordo/dialog-criar-acordo.component';
import { CriarCompetenciaDialogResult } from '../components/dialog-criar-competencia/dialog-criar-competencia.component';
import { RenegociarAcordosDialogResult } from '../components/dialog-renegociar-acordos/dialog-renegociar-acordos.component';

type FolhaRaw = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class FolhaPagamentoService {
  private readonly endpoint = 'api/pessoas/folha';
  private readonly endpointConfig = 'api/pessoas/configuracoes/folha';

  constructor(private readonly api: ApiService) {}

  listarCompetencias$(): Observable<FolhaCompetencia[]> {
    return this.api.get<any[]>(`${this.endpoint}/competencias`).pipe(
      map((res) => (res || []).map((item) => this.mapCompetencia(item)))
    );
  }

  garantirCompetenciaAtual$(regraPagamento?: 'FIXO' | 'QUINTO_DIA_UTIL'): Observable<boolean> {
    const payload = regraPagamento ? { regraPagamento } : {};
    return this.api
      .post<any>(`${this.endpoint}/competencias/garantir-atual`, payload)
      .pipe(map(() => true));
  }

  criarCompetencias$(payload: CriarCompetenciaDialogResult): Observable<boolean> {
    const competencias = (payload.meses || []).map((mes) => `${payload.ano}-${String(mes).padStart(2, '0')}`);
    return this.api
      .post<any[]>(`${this.endpoint}/competencias`, { competencias })
      .pipe(map((res) => Array.isArray(res) && res.length > 0));
  }

  obterConfiguracaoFolha$(): Observable<FolhaConfiguracaoEmpresa> {
    return this.api.get<any>(this.endpointConfig).pipe(map((res) => this.mapConfiguracao(res)));
  }

  salvarConfiguracaoFolha$(payload: FolhaConfiguracaoEmpresa): Observable<FolhaConfiguracaoEmpresa> {
    return this.api.put<any>(this.endpointConfig, payload).pipe(map((res) => this.mapConfiguracao(res)));
  }

  exportarCsv$(competencia?: string): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (competencia) {
      params = params.set('competencia', competencia);
    }
    return this.api.getBlobResponse(`${this.endpoint}/exportar`, params);
  }

  fecharCompetencia$(competencia: string): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/competencias/${competencia}/fechar`, {});
  }

  reabrirCompetencia$(competencia: string): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/competencias/${competencia}/reabrir`, {});
  }

  listarFolhasPorCompetencia$(competencia: string): Observable<FolhaFuncionario[]> {
    return this.api
      .get<FolhaRaw[]>(`${this.endpoint}/competencias/${competencia}/folhas`)
      .pipe(map((res) => (res || []).map((item) => this.mapFolha(item))));
  }

  obterFolha$(competencia: string, funcionarioId: number): Observable<FolhaFuncionario | undefined> {
    return this.api
      .get<FolhaRaw>(`${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}`)
      .pipe(map((res) => (res ? this.mapFolha(res) : undefined)));
  }

  baixarDocumentoPagamento$(competencia: string, funcionarioId: number): Observable<HttpResponse<Blob>> {
    return this.api.getBlobResponse(
      `${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/documento-pagamento`
    );
  }

  lancarBonus$(competencia: string, funcionarioId: number, valor: number, descricao: string): Observable<void> {
    return this.lancar(competencia, funcionarioId, 'PROVENTO', valor, descricao).pipe(map(() => void 0));
  }

  lancarDesconto$(competencia: string, funcionarioId: number, valor: number, descricao: string): Observable<void> {
    return this.lancar(competencia, funcionarioId, 'DESCONTO', valor, descricao).pipe(map(() => void 0));
  }

  criarAcordo$(competencia: string, funcionarioId: number, payload: CriarAcordoDialogResult): Observable<void> {
    return this.api
      .post<FolhaRaw>(`${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/acordos`, payload)
      .pipe(map(() => void 0));
  }

  renegociarAcordos$(
    competencia: string,
    funcionarioId: number,
    payload: RenegociarAcordosDialogResult
  ): Observable<void> {
    return this.api
      .post<FolhaRaw>(
        `${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/acordos/renegociar`,
        payload
      )
      .pipe(map(() => void 0));
  }

  registrarPagamento$(
    competencia: string,
    funcionarioId: number,
    valor: number,
    forma: PagamentoForma,
    observacao?: string
  ): Observable<void> {
    return this.api
      .post<FolhaRaw>(`${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/pagamentos`, {
        forma,
        valor,
        observacao
      })
      .pipe(map(() => void 0));
  }

  registrarAdiantamento$(
    competencia: string,
    funcionarioId: number,
    valor: number,
    competenciaDesconto?: string,
    descricao?: string
  ): Observable<void> {
    const payload: Record<string, any> = { valor };
    if (competenciaDesconto) {
      payload['competenciaDesconto'] = competenciaDesconto;
    }
    if (descricao) {
      payload['descricao'] = descricao;
    }
    return this.api
      .post<FolhaRaw>(`${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/adiantamentos`, payload)
      .pipe(map(() => void 0));
  }

  totalBruto(folha: FolhaFuncionario): number {
    if (Number.isFinite(folha.bruto)) return Number(folha.bruto);
    return folha.lancamentos.filter((l) => l.tipo === 'PROVENTO').reduce((acc, l) => acc + Number(l.valor || 0), 0);
  }

  totalDescontos(folha: FolhaFuncionario): number {
    if (Number.isFinite(folha.descontos)) return Number(folha.descontos);
    return folha.lancamentos.filter((l) => l.tipo === 'DESCONTO').reduce((acc, l) => acc + Number(l.valor || 0), 0);
  }

  totalLiquido(folha: FolhaFuncionario): number {
    if (Number.isFinite(folha.liquido)) return Number(folha.liquido);
    return this.totalBruto(folha) - this.totalDescontos(folha);
  }

  totalPago(folha: FolhaFuncionario): number {
    if (Number.isFinite(folha.pago)) return Number(folha.pago);
    return (folha.pagamentos || []).reduce((acc, p) => acc + Number(p.valor || 0), 0);
  }

  saldoPendente(folha: FolhaFuncionario): number {
    if (Number.isFinite(folha.pendente)) return Number(folha.pendente);
    return Math.max(0, this.totalLiquido(folha) - this.totalPago(folha));
  }

  private lancar(
    competencia: string,
    funcionarioId: number,
    tipo: LancamentoTipo,
    valor: number,
    descricao: string
  ): Observable<FolhaRaw> {
    return this.api.post<FolhaRaw>(`${this.endpoint}/competencias/${competencia}/funcionarios/${funcionarioId}/lancamentos`, {
      tipo,
      descricao,
      valor
    });
  }

  private mapCompetencia(item: any): FolhaCompetencia {
    return {
      competencia: item?.competencia || '',
      status: String(item?.status || 'ABERTA').toUpperCase() === 'FECHADA' ? 'FECHADA' : 'ABERTA',
      regraPagamento: item?.regraPagamento,
      diaPagamento: item?.diaPagamento
    };
  }

  private mapFolha(raw: FolhaRaw): FolhaFuncionario {
    return {
      folhaId: Number(raw?.['folhaId'] || 0) || undefined,
      competencia: raw?.['competencia'] || '',
      funcionarioId: Number(raw?.['funcionarioId'] || 0),
      funcionarioNome: raw?.['funcionarioNome'] || '—',
      telefone: raw?.['funcionarioTelefone'] || raw?.['telefone'] || undefined,
      email: raw?.['funcionarioEmail'] || raw?.['email'] || undefined,
      tipoContrato: raw?.['tipoContrato'] || raw?.['contrato'] || undefined,
      salario:
        raw?.['salario'] != null
          ? Number(raw['salario'])
          : raw?.['salarioBase'] != null
          ? Number(raw['salarioBase'])
          : undefined,
      statusFolha: this.mapStatusFolha(raw?.['status']),
      bruto: Number(raw?.['bruto'] ?? 0),
      descontos: Number(raw?.['descontos'] ?? 0),
      liquido: Number(raw?.['liquido'] ?? 0),
      pago: Number(raw?.['pago'] ?? 0),
      pendente: Number(raw?.['pendente'] ?? 0),
      lancamentos: (raw?.['lancamentos'] || []).map((l: any) => this.mapLancamento(l)),
      pagamentos: (raw?.['pagamentos'] || []).map((p: any) => this.mapPagamento(p)),
      acordos: (raw?.['acordos'] || []).map((a: any) => this.mapAcordo(a))
    };
  }

  private mapLancamento(raw: any): FolhaLancamento {
    const dataHora = raw?.dataHora || raw?.criadoEm || raw?.data;
    return {
      id: Number(raw?.id || 0),
      tipo: String(raw?.tipo || 'DESCONTO').toUpperCase() === 'PROVENTO' ? 'PROVENTO' : 'DESCONTO',
      descricao: raw?.descricao || '—',
      valor: Number(raw?.valor ?? 0),
      criadoEm: dataHora,
      data: dataHora
    };
  }

  private mapPagamento(raw: any): FolhaPagamento {
    const forma = String(raw?.forma || 'PIX').toUpperCase();
    const dataHora = raw?.dataHora || raw?.data || raw?.criadoEm || '';
    return {
      id: Number(raw?.id || 0),
      data: dataHora,
      valor: Number(raw?.valor ?? 0),
      forma: (['PIX', 'TRANSFERENCIA', 'DINHEIRO'].includes(forma) ? forma : 'PIX') as PagamentoForma,
      observacao: raw?.observacao || undefined
    };
  }

  private mapAcordo(raw: any): FolhaAcordo {
    const parcelas = (raw?.listaParcelas || raw?.parcelas || []).map((p: any) => this.mapParcela(p));
    return {
      id: Number(raw?.id || 0),
      tipo: String(raw?.tipo || 'ADIANTAMENTO').toUpperCase() === 'EMPRESTIMO' ? 'EMPRESTIMO' : 'ADIANTAMENTO',
      descricao: raw?.descricao || '—',
      valorTotal: Number(raw?.valorTotal ?? 0),
      competenciaInicio: raw?.competenciaInicio || raw?.dataInicioCompetencia,
      dataInicioCompetencia: raw?.dataInicioCompetencia || raw?.competenciaInicio,
      parcelas,
      listaParcelas: parcelas,
      status: this.mapStatusAcordo(raw?.status)
    };
  }

  private mapParcela(raw: any): FolhaAcordoParcela {
    return {
      numero: Number(raw?.numero || 0),
      competencia: raw?.competencia || '',
      valorPrevisto: Number(raw?.valorPrevisto ?? 0),
      valorDescontado: Number(raw?.valorDescontado ?? 0),
      status: this.mapStatusParcela(raw?.status)
    };
  }

  private mapStatusFolha(status: any): FolhaStatus {
    const s = String(status || 'ABERTO').toUpperCase();
    if (s === 'PAGO') return 'PAGO';
    if (s === 'PARCIAL') return 'PARCIAL';
    if (s === 'FECHADO' || s === 'FECHADA') return 'FECHADO';
    return 'ABERTO';
  }

  private mapStatusAcordo(status: any): 'ATIVO' | 'QUITADO' | 'CANCELADO' | 'RENEGOCIADO' {
    const s = String(status || 'ATIVO').toUpperCase();
    if (s === 'QUITADO') return 'QUITADO';
    if (s === 'CANCELADO') return 'CANCELADO';
    if (s === 'RENEGOCIADO') return 'RENEGOCIADO';
    return 'ATIVO';
  }

  private mapStatusParcela(status: any): 'PENDENTE' | 'PARCIAL' | 'PAGO' | 'CANCELADA' {
    const s = String(status || 'PENDENTE').toUpperCase();
    if (s === 'PAGO') return 'PAGO';
    if (s === 'PARCIAL') return 'PARCIAL';
    if (s === 'CANCELADA') return 'CANCELADA';
    return 'PENDENTE';
  }

  private mapConfiguracao(raw: any): FolhaConfiguracaoEmpresa {
    const regra = String(raw?.['regraPagamentoPadrao'] || 'QUINTO_DIA_UTIL').toUpperCase();
    const politicaPassagem = String(raw?.['politicaPassagem'] || 'NAO_APLICAR').toUpperCase();
    return {
      empresaId: raw?.['empresaId'] != null ? Number(raw['empresaId']) : undefined,
      regraPagamentoPadrao: regra === 'DIA_FIXO' ? 'DIA_FIXO' : 'QUINTO_DIA_UTIL',
      diaPagamentoPadrao: raw?.['diaPagamentoPadrao'] != null ? Number(raw['diaPagamentoPadrao']) : null,
      politicaPassagem:
        politicaPassagem === 'PROVENTO' || politicaPassagem === 'DESCONTO'
          ? politicaPassagem
          : 'NAO_APLICAR',
      permitirAdiantamento: Boolean(raw?.['permitirAdiantamento']),
      permitirEmprestimo: Boolean(raw?.['permitirEmprestimo']),
      limitePercentualSalario:
        raw?.['limitePercentualSalario'] != null ? Number(raw['limitePercentualSalario']) : null,
      maxParcelasEmprestimo:
        raw?.['maxParcelasEmprestimo'] != null ? Number(raw['maxParcelasEmprestimo']) : null,
      carenciaMinCompetencias:
        raw?.['carenciaMinCompetencias'] != null ? Number(raw['carenciaMinCompetencias']) : null,
      updatedAt: raw?.['updatedAt'] ?? null,
      updatedBy: raw?.['updatedBy'] != null ? Number(raw['updatedBy']) : null
    };
  }
}
