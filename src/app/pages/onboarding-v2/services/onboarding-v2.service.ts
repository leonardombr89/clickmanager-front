import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  OnboardingProgress,
  OnboardingV2CompanyPayload,
  OnboardingV2ProductsPayload,
  OnboardingV2RegisterRequest,
  OnboardingV2RegisterResponse,
  OnboardingV2Summary,
  ProdutoTemplate,
} from '../models/onboarding-v2.models';

@Injectable({ providedIn: 'root' })
export class OnboardingV2Service {
  private readonly endpoint = 'api/onboarding/v2';

  constructor(private readonly api: ApiService) {}

  registerEmpresa(payload: OnboardingV2RegisterRequest): Observable<OnboardingV2RegisterResponse> {
    return this.api.post<OnboardingV2RegisterResponse>(`${this.endpoint}/register-empresa`, payload);
  }

  fetchProgress(): Observable<OnboardingProgress> {
    return this.api.get<OnboardingProgress>(`${this.endpoint}/progresso`);
  }

  saveCompany(payload: OnboardingV2CompanyPayload): Observable<OnboardingProgress> {
    return this.api.put<OnboardingProgress>(`${this.endpoint}/empresa`, payload);
  }

  fetchProdutosSugeridos(): Observable<ProdutoTemplate[]> {
    return this.api.get<ProdutoTemplate[]>(`${this.endpoint}/produtos-sugeridos`);
  }

  saveProdutos(payload: OnboardingV2ProductsPayload): Observable<OnboardingProgress> {
    return this.api.post<OnboardingProgress>(`${this.endpoint}/produtos`, payload);
  }

  fetchResumo(): Observable<OnboardingV2Summary> {
    return this.api.get<OnboardingV2Summary>(`${this.endpoint}/resumo`);
  }

  finishOnboarding(): Observable<OnboardingProgress> {
    return this.api.post<OnboardingProgress>(`${this.endpoint}/finalizar`, {});
  }
}
