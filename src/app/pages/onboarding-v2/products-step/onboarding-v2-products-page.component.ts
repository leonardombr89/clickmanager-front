import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { OnboardingShellComponent } from 'src/app/components/onboarding/onboarding-shell.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { AuthService } from 'src/app/services/auth.service';
import {
  ProdutoTemplate,
  formatCentavosToBrl,
  isOnboardingV2Finished,
  resolveOnboardingV2RouteFromProgress,
  resolveOnboardingV2StepFromProgress,
} from '../models/onboarding-v2.models';
import { OnboardingV2StateService } from '../services/onboarding-v2-state.service';

@Component({
  selector: 'app-onboarding-v2-products-page',
  standalone: true,
  imports: [CommonModule, MaterialModule, OnboardingShellComponent, SectionCardComponent],
  templateUrl: './onboarding-v2-products-page.component.html',
  styleUrls: ['./onboarding-v2-products-page.component.scss'],
})
export class OnboardingV2ProductsPageComponent implements OnInit {
  carregando = true;

  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    protected readonly onboardingV2State: OnboardingV2StateService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/onboarding-v2']);
      return;
    }

    this.loadStep();
  }

  toggleProduto(produtoId: number): void {
    this.onboardingV2State.toggleSelectedProduto(produtoId);
  }

  isSelected(produtoId: number): boolean {
    return this.onboardingV2State.selectedProdutoIds().includes(produtoId);
  }

  submit(): void {
    const produtoModeloIds = this.onboardingV2State.selectedProdutoIds();

    if (!produtoModeloIds.length) {
      this.toastr.warning('Selecione ao menos um produto para continuar.');
      return;
    }

    this.onboardingV2State.saveProdutos({ produtoModeloIds }).subscribe({
      next: (progress) => {
        this.toastr.success('Base inicial criada. Vamos revisar o que foi preparado.');
        this.router.navigateByUrl(resolveOnboardingV2RouteFromProgress(progress));
      },
      error: () => {
        this.toastr.error(this.onboardingV2State.error() || 'Não foi possível criar os produtos agora.');
      },
    });
  }

  itemPriceLabel(produto: ProdutoTemplate): string | null {
    const firstServicePrice = produto.servicos.find((item) => item.valorBaseCentavos > 0)?.valorBaseCentavos;
    const firstAcabamentoPrice = produto.acabamentos.find((item) => item.valorBaseCentavos > 0)?.valorBaseCentavos;
    const value = firstServicePrice ?? firstAcabamentoPrice ?? null;

    if (value == null) {
      return null;
    }

    return `${formatCentavosToBrl(value)} base`;
  }

  trackByProduto(index: number, produto: ProdutoTemplate): number {
    return produto.id ?? index;
  }

  private loadStep(): void {
    this.carregando = true;
    this.onboardingV2State
      .refreshProgress()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (progress) => {
          if (progress.onboardingVersion !== 'v2') {
            this.router.navigateByUrl(this.authService.getOnboardingRouteForUsuario(progress.onboardingConcluido));
            return;
          }

          if (isOnboardingV2Finished(progress)) {
            this.router.navigateByUrl(this.authService.getDefaultRouteForUsuario());
            return;
          }

          if (resolveOnboardingV2StepFromProgress(progress) !== 'products') {
            this.router.navigateByUrl(resolveOnboardingV2RouteFromProgress(progress));
            return;
          }

          this.loadProdutosSeNecessario();
        },
        error: () => {
          this.toastr.error(this.onboardingV2State.error() || 'Não foi possível carregar seus produtos sugeridos.');
        },
      });
  }

  private loadProdutosSeNecessario(): void {
    const currentProducts = this.onboardingV2State.produtos();
    if (currentProducts.length) {
      return;
    }

    this.onboardingV2State.loadProdutosSugeridos().subscribe({
      error: () => {
        this.toastr.error(this.onboardingV2State.error() || 'Erro ao carregar produtos sugeridos.');
      },
    });
  }
}
