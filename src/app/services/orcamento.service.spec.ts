import { of } from 'rxjs';
import { OrcamentoCriarRequest } from '../models/orcamento/orcamento.model';
import { OrcamentoService } from './orcamento.service';

describe('OrcamentoService', () => {
  let api: any;
  let service: OrcamentoService;

  beforeEach(() => {
    api = {
      get: jasmine.createSpy('get').and.returnValue(of({ content: [], totalElements: 0 })),
      getBlobResponse: jasmine.createSpy('getBlobResponse').and.returnValue(of({ body: new Blob() })),
      post: jasmine.createSpy('post').and.returnValue(of({ id: 1 })),
      patch: jasmine.createSpy('patch').and.returnValue(of({ id: 1 })),
      put: jasmine.createSpy('put').and.returnValue(of({ id: 1 })),
      delete: jasmine.createSpy('delete').and.returnValue(of({ id: 1 })),
    };
    service = new OrcamentoService(api);
  });

  it('lista no endpoint oficial com texto de pesquisa e origem BALCAO', () => {
    service.listar({ textoPesquisa: '11999999999', origem: 'BALCAO', page: 0, size: 10 }).subscribe();

    expect(api.get).toHaveBeenCalledWith('api/orcamentos', jasmine.anything());
    const params = api.get.calls.mostRecent().args[1];
    expect(params.get('textoPesquisa')).toBe('11999999999');
    expect(params.get('origem')).toBe('BALCAO');
  });

  it('cria orçamento manual no endpoint oficial', () => {
    const payload: OrcamentoCriarRequest = {
      nomeContato: 'Maria',
      telefoneContato: '11999999999',
      emailContato: null,
      clienteId: null,
      origem: 'BALCAO',
      itens: [
        {
          tipoItem: 'LIVRE',
          descricao: 'Item livre',
          unidade: 'UNIDADE',
          quantidade: 1,
          valorUnitario: 10,
          desconto: 0,
        },
      ],
    };

    service.criar(payload).subscribe();

    expect(api.post).toHaveBeenCalledWith('api/orcamentos', payload);
  });

  it('condiciona cancelamento ao endpoint oficial de cancelamento', () => {
    service.cancelar(9, 'Cliente desistiu').subscribe();

    expect(api.patch).toHaveBeenCalledWith('api/orcamentos/9/cancelamento', { justificativa: 'Cliente desistiu' });
  });

  it('gera impressão no endpoint oficial com formato A4 para visualização', () => {
    service.abrirImpressao(9, 'A4').subscribe();

    expect(api.getBlobResponse).toHaveBeenCalledWith('api/orcamentos/9/impressao', jasmine.anything());
    const params = api.getBlobResponse.calls.mostRecent().args[1];
    expect(params.get('formato')).toBe('a4');
    expect(params.get('download')).toBe('false');
  });

  it('gera impressão térmica oficial sem usar endpoint de depósito', () => {
    service.abrirImpressao(9, 'TERMICA_80MM').subscribe();

    expect(api.getBlobResponse).toHaveBeenCalledWith('api/orcamentos/9/impressao', jasmine.anything());
    const params = api.getBlobResponse.calls.mostRecent().args[1];
    expect(params.get('formato')).toBe('termica-80mm');
    expect(params.get('download')).toBe('false');
  });

  it('baixa PDF A4 oficial com download true', () => {
    service.baixarImpressao(9, 'A4').subscribe();

    expect(api.getBlobResponse).toHaveBeenCalledWith('api/orcamentos/9/impressao', jasmine.anything());
    const params = api.getBlobResponse.calls.mostRecent().args[1];
    expect(params.get('formato')).toBe('a4');
    expect(params.get('download')).toBe('true');
  });
});
