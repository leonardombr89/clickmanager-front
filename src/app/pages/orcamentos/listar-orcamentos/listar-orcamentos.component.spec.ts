import { of } from 'rxjs';
import { ListarOrcamentosComponent } from './listar-orcamentos.component';

describe('ListarOrcamentosComponent', () => {
  function criarComponente(permissoes: string[] = []): ListarOrcamentosComponent {
    return new ListarOrcamentosComponent(
      { listar: jasmine.createSpy('listar').and.returnValue(of({ content: [], totalElements: 0 })) } as any,
      { buscarResumo: jasmine.createSpy('buscarResumo').and.returnValue(of(null)) } as any,
      { temPermissao: (permissao: string) => permissoes.includes(permissao) } as any,
      { open: jasmine.createSpy('open') } as any,
      { error: jasmine.createSpy('error'), success: jasmine.createSpy('success'), info: jasmine.createSpy('info') } as any,
    );
  }

  it('exibe botão de criação somente com ORCAMENTOS_CRIAR', () => {
    expect(criarComponente(['ORCAMENTOS_CRIAR']).podeCriar).toBeTrue();
    expect(criarComponente([]).podeCriar).toBeFalse();
  });

  it('protege ações com ORCAMENTOS_EDITAR e ORCAMENTOS_CANCELAR', () => {
    const component = criarComponente(['ORCAMENTOS_EDITAR', 'ORCAMENTOS_CANCELAR']);

    expect(component.podeEditar).toBeTrue();
    expect(component.podeCancelar).toBeTrue();
  });

  it('exibe origem BALCAO como Balcão', () => {
    const component = criarComponente();

    expect(component.origemLabel('BALCAO')).toBe('Balcão');
    expect(component.origemLabel('SITE')).toBe('Site');
    expect(component.origemLabel('INTEGRACAO')).toBe('Integração');
  });
});
