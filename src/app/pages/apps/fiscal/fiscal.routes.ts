import { Routes } from '@angular/router';
import { permissionGuard } from 'src/app/guards/permission.guard';
import { DEPOSITO_ROUTE_DATA } from 'src/app/guards/empresa-tipo-route-data';

export const FiscalRoutes: Routes = [
  { path: '', redirectTo: 'documentos', pathMatch: 'full' },
  {
    path: 'documentos',
    loadComponent: () => import('./documentos/fiscal-documentos.component').then((m) => m.FiscalDocumentosComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_DOCUMENTOS_VER'], title: 'Documentos fiscais', urls: [{ title: 'Fiscal' }, { title: 'Documentos fiscais' }] },
  },
  {
    path: 'documentos/:id',
    loadComponent: () => import('./documentos/fiscal-documento-detalhe.component').then((m) => m.FiscalDocumentoDetalheComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_DOCUMENTOS_VER'], title: 'Detalhe da nota', urls: [{ title: 'Fiscal', url: '/apps/fiscal/documentos' }, { title: 'Detalhe' }] },
  },
  {
    path: 'emitir',
    loadComponent: () => import('./emitir/fiscal-emitir.component').then((m) => m.FiscalEmitirComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_EMITIR'], title: 'Emitir nota', urls: [{ title: 'Fiscal', url: '/apps/fiscal/documentos' }, { title: 'Emitir nota' }] },
  },
  {
    path: 'emitir/:pedidoId',
    loadComponent: () => import('./emitir/fiscal-emitir.component').then((m) => m.FiscalEmitirComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_EMITIR'], title: 'Emitir nota', urls: [{ title: 'Fiscal', url: '/apps/fiscal/documentos' }, { title: 'Emitir nota' }] },
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./configuracoes/fiscal-configuracoes.component').then((m) => m.FiscalConfiguracoesComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_CONFIGURACAO_VER'], title: 'Configurações fiscais', urls: [{ title: 'Fiscal' }, { title: 'Configurações' }] },
  },
  {
    path: 'produtos',
    loadComponent: () => import('./produtos/fiscal-produtos.component').then((m) => m.FiscalProdutosComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_PRODUTOS_VER'], title: 'Produtos fiscais', urls: [{ title: 'Fiscal' }, { title: 'Produtos' }] },
  },
  {
    path: 'regras',
    loadComponent: () => import('./regras/fiscal-regras.component').then((m) => m.FiscalRegrasComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_REGRAS_VER'], title: 'Regras tributárias', urls: [{ title: 'Fiscal' }, { title: 'Regras' }] },
  },
  {
    path: 'inutilizacoes',
    loadComponent: () => import('./inutilizacoes/fiscal-inutilizacoes.component').then((m) => m.FiscalInutilizacoesComponent),
    canActivate: [permissionGuard],
    data: { ...DEPOSITO_ROUTE_DATA, requiredPermission: ['FISCAL_INUTILIZAR'], title: 'Inutilizações', urls: [{ title: 'Fiscal' }, { title: 'Inutilizações' }] },
  },
];
