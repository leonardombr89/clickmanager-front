import { of } from 'rxjs';
import { DetalheOrcamentoComponent } from './detalhe-orcamento.component';

describe('DetalheOrcamentoComponent', () => {
  function criarComponente(permissoes: string[] = [], orcamentoService?: any): DetalheOrcamentoComponent {
    return new DetalheOrcamentoComponent(
      { snapshot: { paramMap: { get: () => '1' } } } as any,
      { navigate: jasmine.createSpy('navigate') } as any,
      orcamentoService || {
        detalhar: jasmine.createSpy('detalhar').and.returnValue(of({ id: 1 })),
        cancelar: jasmine.createSpy('cancelar').and.returnValue(of({ id: 1 })),
        abrirImpressao: jasmine.createSpy('abrirImpressao').and.returnValue(of({ body: new Blob() })),
        baixarImpressao: jasmine.createSpy('baixarImpressao').and.returnValue(of({ body: new Blob(), headers: { get: () => null } })),
      } as any,
      { temPermissao: (permissao: string) => permissoes.includes(permissao) } as any,
      { open: jasmine.createSpy('open') } as any,
      { error: jasmine.createSpy('error'), success: jasmine.createSpy('success'), warning: jasmine.createSpy('warning') } as any,
    );
  }

  it('condiciona edição a ORCAMENTOS_EDITAR', () => {
    expect(criarComponente(['ORCAMENTOS_EDITAR']).podeEditar).toBeTrue();
    expect(criarComponente([]).podeEditar).toBeFalse();
  });

  it('condiciona cancelamento a ORCAMENTOS_CANCELAR', () => {
    expect(criarComponente(['ORCAMENTOS_CANCELAR']).podeCancelar).toBeTrue();
    expect(criarComponente([]).podeCancelar).toBeFalse();
  });

  it('condiciona impressão a ORCAMENTOS_IMPRIMIR', () => {
    expect(criarComponente(['ORCAMENTOS_IMPRIMIR']).podeImprimir).toBeTrue();
    expect(criarComponente(['ORCAMENTOS_VER']).podeImprimir).toBeFalse();
  });

  it('não executa impressão sem ORCAMENTOS_IMPRIMIR', () => {
    const orcamentoService = {
      detalhar: jasmine.createSpy('detalhar').and.returnValue(of({ id: 1 })),
      abrirImpressao: jasmine.createSpy('abrirImpressao').and.returnValue(of({ body: new Blob() })),
    };
    const component = criarComponente(['ORCAMENTOS_VER'], orcamentoService);
    component.orcamento = { id: 1 };

    component.imprimirA4();

    expect(orcamentoService.abrirImpressao).not.toHaveBeenCalled();
  });

  it('exibe itens livres no detalhe', () => {
    const component = criarComponente();
    const item = {
      id: 1,
      tipoItem: 'LIVRE',
      descricao: 'Instalação avulsa',
      unidade: 'UNIDADE',
      quantidade: 1,
      valorUnitario: 100,
      subtotal: 100,
    };

    expect(component.itemTipoLabel(item)).toBe('Item livre');
    expect(component.itemDescricao(item)).toBe('Instalação avulsa');
    expect(component.itemSubtotal(item)).toBe(100);
  });
});
