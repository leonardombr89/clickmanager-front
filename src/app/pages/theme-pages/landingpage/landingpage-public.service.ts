import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';

export type LandingEtapaFunil = 'LANDING_VISUALIZADA' | 'FORMULARIO_VISUALIZADO';

export interface LandingAcessoRequest {
  pagina: string;
  path: string;
  sessionId: string;
  etapaFunil: LandingEtapaFunil;
}

export interface PublicContatoRequest {
  nome: string;
  email: string;
  celular: string;
  mensagem: string;
  pagina: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  sessionId: string;
}

@Injectable({ providedIn: 'root' })
export class LandingpagePublicService {
  private readonly landingAcessosEndpoint = 'api/public/landing-acessos';
  private readonly contatosEndpoint = 'api/public/contatos';

  constructor(private readonly api: ApiService) {}

  registrarEtapa(req: LandingAcessoRequest): Observable<void> {
    return this.api.post<void>(this.landingAcessosEndpoint, req);
  }

  enviarContato(req: PublicContatoRequest): Observable<void> {
    return this.api.post<void>(this.contatosEndpoint, req);
  }
}
