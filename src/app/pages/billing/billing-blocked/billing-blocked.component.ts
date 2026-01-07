import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';

@Component({
  selector: 'app-billing-blocked',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, CardHeaderComponent],
  templateUrl: './billing-blocked.component.html',
  styleUrls: ['./billing-blocked.component.scss']
})
export class BillingBlockedComponent implements OnInit {
  billing: BillingAccessResponse | null = null;
  usuario?: Usuario | null;

  constructor(
    private billingService: BillingService,
    private billingState: BillingStateService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authService.usuario$.subscribe(u => this.usuario = u);
  }

  get isProprietario(): boolean {
    return !!this.usuario?.proprietario;
  }

  get hasCheckout(): boolean {
    // botão fica disponível apenas se backend indicar que é proprietário
    return this.billing?.proprietario === true || this.usuario?.proprietario === true;
  }

  get podeMostrarPagamento(): boolean {
    return this.hasCheckout;
  }

  abrirPagamento(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || this.router.url;
    this.router.navigate(['/billing/pagamento'], { queryParams: { returnUrl } });
  }

  ngOnInit(): void {
    this.billing = this.billingState.snapshot;
    if (!this.billing) {
      this.billingService.obterStatus().subscribe({
        next: (resp) => this.billing = resp,
        error: () => {}
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
