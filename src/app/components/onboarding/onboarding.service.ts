import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AcabamentoPadraoResumidoResponse } from 'src/app/models/acabamento-padrao/acabamento-padrao-resumido-response';
import { EntidadeBasica } from 'src/app/models/entidade-basica.model';
import { ApiService } from 'src/app/services/api.service';

export type OnboardingStep =
  | 'DADOS_EMPRESA'
  | 'ACABAMENTOS_PADRAO'
  | 'CORES_PADRAO'
  | 'FORMATOS_PADRAO'
  | 'MATERIAIS_PADRAO'
  | 'SERVICOS_PADRAO';

export interface OnboardingStepStatus {
  step: OnboardingStep;
  titulo: string;
  descricao: string;
  concluido: boolean;
}

export interface OnboardingStatusResponse {
  empresaNome: string;
  onboardingConcluido: boolean;
  steps: OnboardingStepStatus[];
}

export interface ConcluirTarefaOnboardingRequest {
  step: OnboardingStep;
  acabamentosSelecionadosIds?: number[];
  coresSelecionadasIds?: number[];
  formatosSelecionadosIds?: number[];
  materiaisSelecionadosIds?: number[];
  servicosSelecionadosIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly endpoint = 'api/onboarding';

  constructor(private api: ApiService) {}


  // NOVOS:
  obterStatus(): Observable<OnboardingStatusResponse> {
    return this.api.get<OnboardingStatusResponse>(`${this.endpoint}/status`);
  }

  concluirTarefa(req: ConcluirTarefaOnboardingRequest): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/concluir-tarefa`, req);
  }

  desativarOnboarding(): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/nao-mostrar-mais`, {});
  }

  listarAcabamentosPadrao(): Observable<AcabamentoPadraoResumidoResponse[]> {
    return this.api.get<AcabamentoPadraoResumidoResponse[]>(`api/acabamento-padrao/resumido`);
  }

  listarCoresPadrao(): Observable<EntidadeBasica[]> {
    return this.api.get<EntidadeBasica[]>(`api/cor-padrao/resumido`);
  }

  listarFormatosPadrao(): Observable<EntidadeBasica[]> {
    return this.api.get<EntidadeBasica[]>(`api/formato-padrao/resumido`);
  }

  listarMateriaisPadrao(): Observable<EntidadeBasica[]> {
    return this.api.get<EntidadeBasica[]>(`api/material-padrao/resumido`);
  }

  listarServicosPadrao(): Observable<EntidadeBasica[]> {
    return this.api.get<EntidadeBasica[]>(`api/servico-padrao/resumido`);
  }
}
