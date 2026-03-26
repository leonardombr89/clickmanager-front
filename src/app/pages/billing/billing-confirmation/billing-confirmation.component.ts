import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { CheckoutResponse } from 'src/app/models/billing-access.model';
import { BillingStateService } from '../services/billing-state.service';

type BillingConfirmationMode =
  | 'PAYMENT_CONFIRMED'
  | 'PARTIAL_BENEFIT'
  | 'BENEFIT_EXEMPTION'
  | 'ALREADY_REGULAR';

@Component({
  selector: 'app-billing-confirmation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, CardHeaderComponent],
  templateUrl: './billing-confirmation.component.html',
  styleUrls: ['./billing-confirmation.component.scss']
})
export class BillingConfirmationComponent implements OnInit {
  result: CheckoutResponse | null = null;
  mode: BillingConfirmationMode = 'PAYMENT_CONFIRMED';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private billingState: BillingStateService
  ) {}

  ngOnInit(): void {
    this.hydrateResult();
  }

  get finalValue(): number | null {
    if (typeof this.result?.finalValue === 'number' && Number.isFinite(this.result.finalValue)) {
      return this.result.finalValue;
    }

    const cents = this.result?.finalValueCentavos;
    return typeof cents === 'number' && Number.isFinite(cents) ? cents / 100 : null;
  }

  get originalValue(): number | null {
    if (typeof this.result?.originalValue === 'number' && Number.isFinite(this.result.originalValue)) {
      return this.result.originalValue;
    }

    const cents = this.result?.originalValueCentavos;
    return typeof cents === 'number' && Number.isFinite(cents) ? cents / 100 : null;
  }

  get exibeValores(): boolean {
    return this.finalValue !== null || this.originalValue !== null;
  }

  get temDescontoVisual(): boolean {
    return this.originalValue !== null && this.finalValue !== null && this.originalValue > this.finalValue;
  }

  get valorOriginalLabel(): string {
    if (this.mode === 'BENEFIT_EXEMPTION') {
      return 'Valor original da assinatura';
    }

    if (this.mode === 'PARTIAL_BENEFIT') {
      return 'Valor original do plano';
    }

    return 'Valor original';
  }

  get valorFinalLabel(): string {
    if (this.mode === 'BENEFIT_EXEMPTION') {
      return 'Valor liberado para você';
    }

    if (this.mode === 'PARTIAL_BENEFIT') {
      return 'Valor com benefício aplicado';
    }

    if (this.mode === 'PAYMENT_CONFIRMED') {
      return 'Valor confirmado da cobrança';
    }

    return 'Valor final';
  }

  get heroLabel(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'Pagamento com benefício';
      case 'BENEFIT_EXEMPTION':
        return 'Liberação especial';
      case 'ALREADY_REGULAR':
        return 'Regularização concluída';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'Compra concluída';
    }
  }

  get title(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'Pagamento confirmado com benefício';
      case 'BENEFIT_EXEMPTION':
        return 'Assinatura liberada por isenção';
      case 'ALREADY_REGULAR':
        return 'Assinatura já regularizada';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'Pagamento confirmado';
    }
  }

  get subtitle(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'Seu pagamento foi concluído com uma condição exclusiva pensada para a sua empresa.';
      case 'BENEFIT_EXEMPTION':
        return 'Sua assinatura foi liberada com uma condição exclusiva, sem necessidade de cobrança.';
      case 'ALREADY_REGULAR':
        return 'Não foi necessário gerar uma nova cobrança para este plano.';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'Sua assinatura foi atualizada e o acesso já está pronto para uso.';
    }
  }

  get message(): string {
    if (this.result?.message?.trim()) {
      return this.result.message.trim();
    }

    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'Você é um cliente especial para o ClickManager e, por isso, recebeu um benefício exclusivo na sua assinatura.';
      case 'BENEFIT_EXEMPTION':
        return 'Você é um cliente especial para o ClickManager e, por isso, sua assinatura foi liberada com uma condição exclusiva, sem cobrança.';
      case 'ALREADY_REGULAR':
        return 'O plano selecionado já estava regular para a sua empresa.';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'Recebemos a confirmação do pagamento e já validamos a regularização da sua assinatura.';
    }
  }

  get destaqueTitle(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'Benefício exclusivo aplicado';
      case 'BENEFIT_EXEMPTION':
        return 'Isenção exclusiva liberada';
      case 'ALREADY_REGULAR':
        return 'Nenhuma cobrança adicional necessária';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'Compra concluída com sucesso';
    }
  }

  get destaqueBody(): string {
    if ((this.mode === 'PARTIAL_BENEFIT' || this.mode === 'BENEFIT_EXEMPTION') && this.result?.benefitCode) {
      return this.mode === 'PARTIAL_BENEFIT'
        ? `Como reconhecimento pelo valor da sua empresa para o ClickManager, aplicamos um benefício exclusivo na sua assinatura. Código do benefício: ${this.result.benefitCode}.`
        : `Como reconhecimento pelo valor da sua empresa para o ClickManager, liberamos sua assinatura com isenção exclusiva. Código do benefício: ${this.result.benefitCode}.`;
    }

    if (this.mode === 'PARTIAL_BENEFIT') {
      return 'Seu pagamento foi concluído com uma condição diferenciada, aplicada exclusivamente para a sua empresa.';
    }

    if (this.mode === 'BENEFIT_EXEMPTION') {
      return 'Sua empresa recebeu uma condição diferenciada e a assinatura foi liberada sem cobrança, como um benefício exclusivo.';
    }

    if (this.mode === 'ALREADY_REGULAR') {
      return 'Seu plano já estava coberto e o sistema reconheceu a regularização automaticamente.';
    }

    return 'Obrigado pela compra. Sua assinatura está ativa e você já pode seguir usando o sistema normalmente.';
  }

  get badgeText(): string {
    if ((this.mode === 'PARTIAL_BENEFIT' || this.mode === 'BENEFIT_EXEMPTION') && this.result?.benefitCode) {
      return this.result.benefitCode;
    }
    if (this.mode === 'ALREADY_REGULAR') {
      return 'Plano regular';
    }
    if (this.mode === 'PARTIAL_BENEFIT') {
      return 'Benefício aplicado';
    }
    if (this.mode === 'BENEFIT_EXEMPTION') {
      return 'Isenção especial';
    }
    return 'Assinatura ativa';
  }

  get cardClass(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'confirmation-card confirmation-card--partial-benefit';
      case 'BENEFIT_EXEMPTION':
        return 'confirmation-card confirmation-card--benefit';
      case 'ALREADY_REGULAR':
        return 'confirmation-card confirmation-card--regular';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'confirmation-card confirmation-card--success';
    }
  }

  get icon(): string {
    switch (this.mode) {
      case 'PARTIAL_BENEFIT':
        return 'redeem';
      case 'BENEFIT_EXEMPTION':
        return 'workspace_premium';
      case 'ALREADY_REGULAR':
        return 'verified';
      case 'PAYMENT_CONFIRMED':
      default:
        return 'celebration';
    }
  }

  irParaAssinatura(): void {
    this.router.navigate(['/billing/minha-assinatura']);
  }

  voltarAoSistema(): void {
    const returnUrl = this.billingState.getReturnUrl() || sessionStorage.getItem('billing_return_url') || '/';
    this.router.navigateByUrl(returnUrl);
  }

  private hydrateResult(): void {
    const stateResult = window.history.state?.billingConfirmationResult as CheckoutResponse | undefined;
    const storedRaw = sessionStorage.getItem('billing_checkout_result');
    const storedResult = storedRaw ? this.parseStoredResult(storedRaw) : null;
    const previewResult = this.resolvePreviewResult();

    this.result = stateResult || storedResult || previewResult || { provider: 'ASAAS', outcome: 'PAYMENT_CONFIRMED' };
    this.mode = this.resolveMode(this.result);

    if (storedRaw) {
      sessionStorage.removeItem('billing_checkout_result');
    }
  }

  private resolveMode(result: CheckoutResponse | null): BillingConfirmationMode {
    const explicitMode = `${result?.confirmationMode || ''}`.toUpperCase();
    const outcome = `${result?.outcome || ''}`.toUpperCase();
    const hasBenefit = !!result?.benefitCode || !!result?.benefitApplied;

    if (explicitMode === 'PARTIAL_BENEFIT') {
      return 'PARTIAL_BENEFIT';
    }

    if (explicitMode === 'BENEFIT_EXEMPTION') {
      return 'BENEFIT_EXEMPTION';
    }

    if (outcome === 'BENEFIT_APPLIED') {
      return 'BENEFIT_EXEMPTION';
    }

    if (outcome === 'PAYMENT_CONFIRMED' && hasBenefit) {
      return 'PARTIAL_BENEFIT';
    }

    if (outcome === 'ALREADY_REGULAR') {
      return 'ALREADY_REGULAR';
    }

    return 'PAYMENT_CONFIRMED';
  }

  private parseStoredResult(raw: string): CheckoutResponse | null {
    try {
      return JSON.parse(raw) as CheckoutResponse;
    } catch {
      return null;
    }
  }

  private resolvePreviewResult(): CheckoutResponse | null {
    const mode = `${this.route.snapshot.queryParamMap.get('modo') || ''}`.trim().toLowerCase();

    switch (mode) {
      case 'isencao':
        return {
          provider: 'ADMIN_BENEFICIO',
          outcome: 'BENEFIT_APPLIED',
          originalValue: 574.5,
          finalValue: 0,
          requiresPayment: false,
          benefitApplied: true,
          benefitCode: 'CLIENTE_ESPECIAL',
          confirmationMode: 'BENEFIT_EXEMPTION',
          message: 'Sua assinatura foi liberada com uma isenção especial por você ser um cliente especial.'
        };
      case 'parcial':
        return {
          provider: 'ASAAS',
          outcome: 'PAYMENT_CONFIRMED',
          originalValue: 1149,
          finalValue: 574.5,
          requiresPayment: false,
          benefitApplied: true,
          benefitCode: 'CLIENTE_ESPECIAL',
          confirmationMode: 'PARTIAL_BENEFIT',
          message: 'Pagamento confirmado com benefício parcial aplicado por você ser um cliente especial.'
        };
      case 'regular':
        return {
          provider: 'ASAAS',
          outcome: 'ALREADY_REGULAR',
          originalValue: 574.5,
          finalValue: 574.5,
          requiresPayment: false,
          benefitApplied: false,
          confirmationMode: 'ALREADY_REGULAR',
          message: 'Assinatura já está regular para o plano selecionado.'
        };
      case 'pagamento':
        return {
          provider: 'ASAAS',
          outcome: 'PAYMENT_CONFIRMED',
          originalValue: 574.5,
          finalValue: 574.5,
          requiresPayment: false,
          benefitApplied: false,
          message: 'Pagamento confirmado e assinatura validada com sucesso.'
        };
      default:
        return null;
    }
  }
}
