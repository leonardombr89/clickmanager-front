import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { SitePaginaBlocoResponse, SitePaginaBlocoTipo } from 'src/app/pages/site/models/site-pagina-bloco.models';
import { SitePaginaBlocoService } from 'src/app/pages/site/services/site-pagina-bloco.service';
import { BlocoPreviewComponent } from '../bloco-preview/bloco-preview.component';
import { FormBlocoComponent } from '../form-bloco/form-bloco.component';

@Component({
  selector: 'app-listar-blocos',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    SectionCardComponent,
    TemPermissaoDirective,
    BlocoPreviewComponent,
  ],
  templateUrl: './listar-blocos.component.html',
  styleUrl: './listar-blocos.component.scss',
})
export class ListarBlocosComponent implements OnChanges {
  @Input() paginaId!: number;

  blocos: SitePaginaBlocoResponse[] = [];
  carregando = false;
  readonly colunasExibidas = ['ordem', 'preview', 'status', 'acoes'];

  constructor(
    private readonly blocoService: SitePaginaBlocoService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['paginaId'] && this.paginaId && this.podeVerBlocos) {
      this.carregarBlocos();
    }
  }

  get podeVerBlocos(): boolean {
    return this.authService.temPermissao('SITE_PAGINA_BLOCOS_VER');
  }

  get proximaOrdem(): number {
    const maiorOrdem = this.blocos.reduce((maior, bloco) => Math.max(maior, Number(bloco.ordem || 0)), 0);
    return maiorOrdem + 1 || 1;
  }

  carregarBlocos(mensagemSucesso?: string): void {
    this.carregando = true;
    this.blocoService.listar(this.paginaId).subscribe({
      next: (blocos) => {
        this.blocos = [...(blocos || [])].sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
        this.carregando = false;
        if (mensagemSucesso) {
          this.toastr.success(mensagemSucesso);
        }
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Não foi possível carregar os blocos da página.');
      },
    });
  }

  adicionar(): void {
    this.abrirDialog();
  }

  editar(bloco: SitePaginaBlocoResponse): void {
    this.blocoService.buscarPorId(this.paginaId, bloco.id).subscribe({
      next: (detalhe) => this.abrirDialog(detalhe),
      error: () => this.toastr.error('Não foi possível carregar o bloco.'),
    });
  }

  alterarStatus(bloco: SitePaginaBlocoResponse): void {
    const novoStatus = !bloco.ativo;
    this.blocoService.alterarStatus(this.paginaId, bloco.id, novoStatus).subscribe({
      next: () => {
        this.toastr.success(novoStatus ? 'Bloco ativado com sucesso!' : 'Bloco desativado com sucesso!');
        this.carregarBlocos();
      },
      error: () => this.toastr.error('Não foi possível alterar o status do bloco.'),
    });
  }

  excluir(bloco: SitePaginaBlocoResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir bloco',
        message: `Tem certeza que deseja excluir o bloco "${bloco.titulo || this.labelTipo(bloco.tipo)}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.blocoService.excluir(this.paginaId, bloco.id).subscribe({
        next: () => {
          this.toastr.success('Bloco excluído com sucesso!');
          this.carregarBlocos();
        },
        error: () => this.toastr.error('Erro ao excluir o bloco.'),
      });
    });
  }

  mover(bloco: SitePaginaBlocoResponse, direcao: -1 | 1): void {
    const index = this.blocos.findIndex((item) => item.id === bloco.id);
    const targetIndex = index + direcao;

    if (index < 0 || targetIndex < 0 || targetIndex >= this.blocos.length) {
      return;
    }

    const novaLista = [...this.blocos];
    [novaLista[index], novaLista[targetIndex]] = [novaLista[targetIndex], novaLista[index]];

    const payload = {
      blocos: novaLista.map((item, idx) => ({
        id: item.id,
        ordem: idx + 1,
      })),
    };

    this.blocoService.reordenar(this.paginaId, payload).subscribe({
      next: () => {
        this.toastr.success('Ordem dos blocos atualizada.');
        this.carregarBlocos();
      },
      error: () => this.toastr.error('Não foi possível atualizar a ordem dos blocos.'),
    });
  }

  statusLabel(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  labelTipo(tipo: SitePaginaBlocoTipo): string {
    const labels: Record<SitePaginaBlocoTipo, string> = {
      TEXTO: 'Texto',
      IMAGEM: 'Imagem',
      TEXTO_IMAGEM: 'Texto + imagem',
      FAQ: 'FAQ',
      CTA: 'CTA',
      VIDEO: 'Video',
      GALERIA: 'Galeria',
      MAPA: 'Mapa',
      PRODUTOS: 'Produtos',
      CATEGORIAS: 'Categorias',
      MARCAS: 'Marcas',
    };

    return labels[tipo] || tipo;
  }

  trackByBloco(index: number, bloco: SitePaginaBlocoResponse): number {
    return bloco.id ?? index;
  }

  private abrirDialog(bloco?: SitePaginaBlocoResponse): void {
    const dialogRef = this.dialog.open(FormBlocoComponent, {
      width: '820px',
      maxWidth: '96vw',
      data: {
        paginaId: this.paginaId,
        bloco: bloco || null,
        proximaOrdem: this.proximaOrdem,
      },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.salvou) {
        const mensagem = resultado.acao === 'atualizado'
          ? 'Bloco atualizado com sucesso!'
          : 'Bloco criado com sucesso!';
        this.carregarBlocos(mensagem);
      }
    });
  }
}
