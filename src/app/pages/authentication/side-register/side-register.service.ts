import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaComUsuarioCreateRequest } from 'src/app/models/empresa/empresa.usuario.create.request';
import { ApiService } from 'src/app/services/api.service';

export interface OnboardingCadastroResponse {
  cadastroConcluido: boolean;
  eventoConversao: string;
  empresaId: number;
  empresaNome: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioUsername: string;
  onboardingConcluido: boolean;
  trialInicio: string;
  trialFim: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {

  private readonly endpoint = 'api/onboarding';

  constructor(private api: ApiService) {}

  registrarEmpresaComGestor(
    payload: EmpresaComUsuarioCreateRequest
  ): Observable<OnboardingCadastroResponse> {
    return this.api.post<OnboardingCadastroResponse>(`${this.endpoint}/register-empresa`, payload);
  }
}
