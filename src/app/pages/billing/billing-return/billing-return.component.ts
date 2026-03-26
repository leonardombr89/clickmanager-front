import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { BillingService } from '../services/billing.service';
import { BillingStateService } from '../services/billing-state.service';
import { ToastrService } from 'ngx-toastr';
import { CheckoutResponse } from 'src/app/models/billing-access.model';

@Component({
  selector: 'app-billing-return',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './billing-return.component.html',
  styleUrls: ['./billing-return.component.scss']
})
export class BillingReturnComponent implements OnInit, OnDestroy {
  loading = true;
  attempts = 0;
  maxAttempts = 12; // 12 * 5s = 60s
  sub?: Subscription;

  constructor(
    private billingService: BillingService,
    private billingState: BillingStateService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.iniciarValidacao();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  iniciarValidacao(): void {
    this.loading = true;
    this.attempts = 0;
    this.sub?.unsubscribe();

    this.sub = timer(0, 5000)
      .pipe(
        takeWhile(() => this.attempts < this.maxAttempts),
        switchMap(() => {
          this.attempts++;
          return this.billingService.obterStatus();
        })
      )
      .subscribe({
        next: (resp) => {
          if (resp?.allowed) {
            this.billingState.setFromResponse(resp);
            this.redirecionarSucesso();
          } else if (resp?.allowed === false) {
            this.billingState.setFromResponse(resp);
            this.router.navigate(['/billing/blocked']);
            this.parar();
          }
        },
        error: () => {
          // se voltar 402, o interceptor já redireciona; aqui só paramos o polling
          this.parar();
        }
      });
  }

  tentarNovamente(): void {
    this.iniciarValidacao();
  }

  private parar(): void {
    this.loading = false;
    this.sub?.unsubscribe();
  }

  private redirecionarSucesso(): void {
    this.parar();
    const pendingCheckout = this.readPendingCheckout();
    const benefitCode = pendingCheckout?.benefitCode?.trim() || null;
    const partialBenefit = !!benefitCode || !!pendingCheckout?.benefitApplied;
    const confirmationResult: CheckoutResponse = {
      provider: pendingCheckout?.provider || 'ASAAS',
      paymentReference: pendingCheckout?.paymentReference || pendingCheckout?.paymentId,
      originalValue: pendingCheckout?.originalValue ?? null,
      finalValue: pendingCheckout?.finalValue ?? null,
      originalValueCentavos: pendingCheckout?.originalValueCentavos ?? null,
      finalValueCentavos: pendingCheckout?.finalValueCentavos ?? null,
      requiresPayment: false,
      benefitApplied: partialBenefit,
      benefitCode,
      confirmationMode: partialBenefit ? 'PARTIAL_BENEFIT' : 'PAYMENT_CONFIRMED',
      outcome: 'PAYMENT_CONFIRMED',
      message: partialBenefit
        ? `Pagamento confirmado com benefício especial${benefitCode ? ` (${benefitCode})` : ''}.`
        : 'Pagamento confirmado e assinatura validada com sucesso.'
    };

    sessionStorage.setItem('billing_checkout_result', JSON.stringify(confirmationResult));
    sessionStorage.removeItem('billing_checkout_pending');
    this.router.navigate(['/billing/confirmacao'], {
      state: {
        billingConfirmationResult: confirmationResult
      }
    });
    this.toastr.success(partialBenefit ? 'Pagamento confirmado com benefício aplicado.' : 'Assinatura validada com sucesso.');
  }

  private readPendingCheckout(): CheckoutResponse | null {
    const raw = sessionStorage.getItem('billing_checkout_pending');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as CheckoutResponse;
    } catch {
      return null;
    }
  }
}
