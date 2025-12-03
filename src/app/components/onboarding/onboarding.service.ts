import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AcabamentoPadraoResumidoResponse } from 'src/app/models/acabamento-padrao/acabamento-padrao-resumido-response';
import { ApiService } from 'src/app/services/api.service';

export interface OnboardingStepStatus {
  step: 'DADOS_EMPRESA' | 'ACABAMENTOS_PADRAO';
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
  step: 'DADOS_EMPRESA' | 'ACABAMENTOS_PADRAO';
  acabamentosSelecionadosIds?: number[];
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
}
