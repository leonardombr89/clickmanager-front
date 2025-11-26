import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[temPermissao]'
})
export class TemPermissaoDirective {
  private permissoes: string[] = [];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set temPermissao(valor: string | string[]) {
    this.permissoes = Array.isArray(valor) ? valor : [valor];
    this.atualizarVisibilidade();
  }

  private atualizarVisibilidade(): void {
    const temAlgumaPermissao = this.permissoes.some(permissao =>
      this.authService.temPermissao(permissao)
    );

    if (temAlgumaPermissao) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
