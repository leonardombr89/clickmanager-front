import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { BillingService } from '../services/billing.service';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';

interface Pagamento {
  id: number;
  valor: number;
  status: string;
  criadoEm: string;
  confirmadoEm?: string;
  referenciaExterna?: string;
  invoiceUrl?: string;
}

@Component({
  selector: 'app-minha-assinatura',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './minha-assinatura.component.html',
  styleUrls: ['./minha-assinatura.component.scss']
})
export class MinhaAssinaturaComponent implements OnInit {
  loading = true;
  resumo: any = null;
  pagamentos: Pagamento[] = [];
  usuario?: Usuario | null;
  acessoNegado = false;
  resumoCarregado = false;

  displayedColumns = ['valor', 'forma', 'criado', 'confirmado', 'status', 'referencia', 'link'];

  constructor(
    private billingService: BillingService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      this.acessoNegado = !u?.proprietario;

       if (this.acessoNegado) {
         this.loading = false;
         return;
       }

       if (!this.resumoCarregado) {
         this.resumoCarregado = true;
         this.carregarResumo();
       }
    });
  }

  carregarResumo(): void {
    this.loading = true;
    this.billingService.resumoAssinatura().subscribe({
      next: (res) => {
        this.resumo = res;
        this.pagamentos = (res?.pagamentos || []).sort((a: Pagamento, b: Pagamento) => {
          return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
        });
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Não foi possível carregar a assinatura.');
        this.resumoCarregado = false;
        this.loading = false;
      }
    });
  }

  badgeColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    const s = (status || '').toUpperCase();
    if (s === 'APROVADO') return 'primary';
    if (s === 'PENDENTE') return 'accent';
    if (s === 'RECUSADO' || s === 'CANCELADO' || s === 'ESTORNADO' || s === 'CHARGEBACK') return 'warn';
    return undefined;
  }

  abrirLink(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  get beneficios(): string[] {
    const raw = this.resumo?.beneficiosJson;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  get limites(): string[] {
    const raw = this.resumo?.limitesJson;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
      }
      return [];
    } catch {
      return [];
    }
  }

  get emTrial(): boolean {
    const status = (this.resumo?.status || '').toString().toUpperCase();
    return status.includes('TRIAL');
  }

  irParaPlanos(): void {
    this.router.navigate(['/billing/pagamento']);
  }
}
