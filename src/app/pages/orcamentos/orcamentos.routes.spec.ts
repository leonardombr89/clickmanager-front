import { PagesRoutes } from '../pages.routes';

describe('Rotas oficiais de orçamentos', () => {
  it('exige ORCAMENTOS_VER na listagem e detalhe', () => {
    const listagem = PagesRoutes.find((route) => route.path === 'orcamentos');
    const detalhe = PagesRoutes.find((route) => route.path === 'orcamentos/:id');

    expect(listagem?.data?.['requiredPermission']).toEqual(['ORCAMENTOS_VER']);
    expect(detalhe?.data?.['requiredPermission']).toEqual(['ORCAMENTOS_VER']);
  });

  it('exige ORCAMENTOS_CRIAR na criação antes da rota de detalhe', () => {
    const novoIndex = PagesRoutes.findIndex((route) => route.path === 'orcamentos/novo');
    const detalheIndex = PagesRoutes.findIndex((route) => route.path === 'orcamentos/:id');
    const novo = PagesRoutes[novoIndex];

    expect(novoIndex).toBeGreaterThan(-1);
    expect(novoIndex).toBeLessThan(detalheIndex);
    expect(novo.data?.['requiredPermission']).toEqual(['ORCAMENTOS_CRIAR']);
  });
});
