import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { StorageReconciliationResult } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-storage-reconciliacao',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, TemPermissaoDirective],
  templateUrl: './storage-reconciliacao.component.html',
  styleUrl: './storage-reconciliacao.component.scss',
})
export class StorageReconciliacaoComponent {
  executando = false;
  resultado: StorageReconciliationResult | null = null;

  constructor(
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService
  ) {}

  executar(): void {
    this.executando = true;
    this.storageService.reconciliar().subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.executando = false;
        this.toastr.success('Reconciliação executada.');
      },
      error: (err) => {
        this.executando = false;
        this.toastr.error(err?.userMessage || 'Não foi possível executar a reconciliação.');
      },
    });
  }

  get verificados(): number {
    return this.resultado?.quantidadeVerificada ?? this.resultado?.verificados ?? 0;
  }

  get executadoEm(): string {
    return this.resultado?.dataHora || this.resultado?.executadoEm || '-';
  }
}
