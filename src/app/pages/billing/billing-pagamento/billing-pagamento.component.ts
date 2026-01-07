import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'ngx-toastr';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { ApiService } from 'src/app/services/api.service';
import { PlanoPublico } from 'src/app/types/plano-publico.type';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PricingCardComponent } from 'src/app/components/pricing-card/pricing-card.component';

@Component({
  selector: 'app-billing-pagamento',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatCardModule, MatSlideToggleModule, CardHeaderComponent, TablerIconsModule, PricingCardComponent],
  templateUrl: './billing-pagamento.component.html',
  styleUrls: ['./billing-pagamento.component.scss']
})
export class BillingPagamentoComponent implements OnInit {
  billing: BillingAccessResponse | null = null;
  loading = false;
  ownerDenied = false;
  returnUrl: string | null = null;
  planos: PlanoPublico[] = [];
  planoSelecionado: PlanoPublico | null = null;
  mostrarAnual = false;

  constructor(
    private billingState: BillingStateService,
    private billingService: BillingService,
    private api: ApiService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.billing = this.billingState.snapshot;

    if (!this.billing) {
      this.carregarStatus();
    } else {
      this.verificarPlanos();
    }
  }

  private carregarStatus(): void {
    this.billingService.obterStatus().subscribe({
      next: (resp) => {
        this.billingState.setFromResponse(resp);
        this.billing = resp;
        this.verificarPlanos();
      },
      error: () => {
        this.toastr.error('Não foi possível carregar o status de assinatura.');
      }
    });
  }

  private verificarPlanos(): void {
    this.billingService.listarPlanosPublicos().subscribe({
      next: (planos) => {
        const comDefaults = (planos || []).map((plano, idx) => ({
          ...plano,
          // normaliza campos vindos do back (camelCase) para os consumidos pelo front
          preco_centavos: plano.preco_centavos ?? (plano as any).precoCentavos,
          beneficios_json: plano.beneficios_json ?? (plano as any).beneficiosJson,
          limites_json: plano.limites_json ?? (plano as any).limitesJson,
          periodicidade: plano.periodicidade ?? (plano as any).periodicidade,
          imgSrc: plano.imgSrc || this.fallbackImg(idx),
          popular: plano.popular ?? idx === 1,
        }));
        this.planos = comDefaults.sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
        if (this.billing?.planoId) {
          this.planoSelecionado = this.planos.find((plano) => plano.id === this.billing?.planoId) || null;
        } else {
          this.planoSelecionado = null;
        }
      },
      error: () => {
        this.toastr.error('Não foi possível carregar os planos disponíveis.');
      }
    });
  }

  get badgeLabel(): string {
    if (this.billing?.type === 'PRE_DUE' || this.billing?.type === 'POST_DUE') return 'Aviso';
    if (this.billing?.type === 'BLOCKED') return 'Acesso bloqueado';
    return '';
  }

  get podePagar(): boolean {
    if (this.ownerDenied) return false;
    const autorizado = this.billing?.proprietario === true;
    if (!autorizado) return false;
    if (!this.billing?.planoId) {
      return !!this.planoSelecionado;
    }
    return true;
  }

  getBeneficios(plano: PlanoPublico): string[] {
    const beneficios = plano.beneficios_json;
    if (!beneficios) return [];
    if (Array.isArray(beneficios)) return beneficios as string[];
    try {
      const parsed = JSON.parse(beneficios);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  preco(plano: PlanoPublico): number {
    return (plano.preco_centavos || 0) / 100;
  }

  precoAnual(plano: PlanoPublico): number {
    return this.preco(plano) * 12;
  }

  selecionar(plano: PlanoPublico): void {
    this.planoSelecionado = plano;
  }

  private fallbackImg(idx: number): string {
    const assets = [
      '/assets/images/backgrounds/silver.png',
      '/assets/images/backgrounds/bronze.png',
      '/assets/images/backgrounds/gold.png',
    ];
    return assets[idx % assets.length];
  }

  irParaPagamento(): void {
    if (this.billing?.proprietario !== true) {
      this.toastr.error('Somente o proprietário pode regularizar a assinatura.');
      this.ownerDenied = true;
      return;
    }

    this.loading = true;
    const body: any = {};
    if (this.planoSelecionado?.id) {
      body.planoId = this.planoSelecionado.id;
    }

    this.billingService.checkout(body).subscribe({
      next: (resp) => {
        const link = resp?.link || resp?.initPoint || resp?.init_point;
        if (link) {
          window.location.href = link;
        } else {
          this.toastr.error('Não foi possível iniciar o checkout.');
        }
      },
      error: (err) => {
        if (err?.status === 403) {
          this.ownerDenied = true;
          this.toastr.error('Somente o proprietário pode regularizar a assinatura.');
        } else if (err?.error?.billing) {
          this.billingState.setFromErrorBody(err, this.router.url);
          this.billing = this.billingState.snapshot;
          this.toastr.error(this.billing?.message || 'Acesso bloqueado.');
        } else {
          this.toastr.error('Não foi possível iniciar o checkout.');
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  voltar(): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
