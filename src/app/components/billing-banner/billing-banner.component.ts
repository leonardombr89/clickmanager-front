import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';

@Component({
  selector: 'app-billing-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './billing-banner.component.html',
  styleUrls: ['./billing-banner.component.scss']
})
export class BillingBannerComponent {
  usuario?: Usuario | null;

  constructor(
    public billingState: BillingStateService,
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.usuario$.subscribe(u => this.usuario = u);
  }

  get isProprietario(): boolean {
    return !!this.usuario?.proprietario;
  }

  get hasCheckout(): boolean {
    return this.billingState.snapshot?.proprietario === true || this.usuario?.proprietario === true;
  }

  get podeMostrarPagamento(): boolean {
    return this.hasCheckout;
  }

  irParaPagamento(): void {
    this.router.navigate(['/billing/pagamento'], { queryParams: { from: 'banner' } });
  }
}
