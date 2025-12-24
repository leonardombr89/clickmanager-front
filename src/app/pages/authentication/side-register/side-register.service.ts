import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaComUsuarioCreateRequest } from 'src/app/models/empresa/empresa.usuario.create.request';
import { ApiService } from 'src/app/services/api.service';


@Injectable({ providedIn: 'root' })
export class OnboardingService {

  private readonly endpoint = 'api/onboarding';

  constructor(private api: ApiService) {}

  registrarEmpresaComGestor(
    payload: EmpresaComUsuarioCreateRequest
  ): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/register-empresa`, payload);
  }
}