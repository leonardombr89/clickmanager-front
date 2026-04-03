import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { PedidoService } from '../pedido.service';

@Component({
  selector: 'app-imprimir-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './imprimir-pedido.page.html',
  styleUrls: ['imprimir-pedido.page.scss']
})
export class ImprimirPedidoPageComponent implements OnInit, OnDestroy {
  pedido: PedidoResponse | null = null;
  isDuasVias = false;
  isMobileView = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private pdfObjectUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isDuasVias = this.route.snapshot.routeConfig?.path?.includes('imprimir-duas-vias') ?? false;

    this.pedidoService.buscarPorId(id).subscribe((res) => {
      this.pedido = res;
    });

    this.carregarPdf(id);
  }

  ngOnDestroy(): void {
    this.limparPdfUrl();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  private atualizarViewport(): void {
    this.isMobileView = (globalThis?.innerWidth ?? 0) <= 900;
  }

  onPrint(): void {
    if (!this.pdfObjectUrl) return;
    const popup = window.open(this.pdfObjectUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      this.toastr.info('Permita a abertura do PDF para continuar.');
    }
  }

  fecharPreview(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/page/pedido']);
      return;
    }
    this.router.navigate(['/page/pedido/detalhe', id]);
  }

  get mobilePrimaryActionLabel(): string {
    return 'Imprimir';
  }

  executarAcaoPrincipalMobile(): void {
    this.onPrint();
  }

  private carregarPdf(id: number): void {
    const layout = this.isDuasVias ? 'duas-vias' : 'completo';
    this.pedidoService.gerarPdf(id, layout).subscribe({
      next: (response) => {
        if (!response.body) {
          this.toastr.error('Não foi possível gerar o PDF.');
          return;
        }
        this.limparPdfUrl();
        this.pdfObjectUrl = URL.createObjectURL(response.body);
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
      },
      error: () => {
        this.toastr.error('Não foi possível carregar o PDF.');
      }
    });
  }

  private limparPdfUrl(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfPreviewUrl = null;
  }
}
