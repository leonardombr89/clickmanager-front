import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './pages/authentication/guards/auth.guard';
import { ImprimirPedidoComponent } from './pages/pedido/pedido-imprimir/imprimir-pedido.component';
import { PrintComponent } from './layouts/print/print.component';
import { ImprimirEtiquetasComponent } from './pages/pedido/pedido-imprimir-etiquetas/imprimir-etiquetas.component';
import { ImprimirWhatsAppComponent } from './pages/pedido/pedido-imprimir-whatsapp/imprimir-whatsapp.component';
import { BillingBlockedComponent } from './pages/billing/billing-blocked/billing-blocked.component';
import { BillingPagamentoComponent } from './pages/billing/billing-pagamento/billing-pagamento.component';
import { BillingReturnComponent } from './pages/billing/billing-return/billing-return.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landingpage',
  },
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    data: { perfil: 'GESTOR' },
    children: [
      {
        path: '',
        redirectTo: '/dashboards/dashboard1',
        pathMatch: 'full'
      },
      {
        path: 'page',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'dashboards',
        loadChildren: () =>
          import('./pages/dashboards/dashboards.routes').then(
            (m) => m.DashboardsRoutes
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'forms',
        loadChildren: () =>
          import('./pages/forms/forms.routes').then((m) => m.FormsRoutes),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'charts',
        loadChildren: () =>
          import('./pages/charts/charts.routes').then((m) => m.ChartsRoutes),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'apps',
        loadChildren: () =>
          import('./pages/apps/apps.routes').then((m) => m.AppsRoutes),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'widgets',
        loadChildren: () =>
          import('./pages/widgets/widgets.routes').then(
            (m) => m.WidgetsRoutes
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'tables',
        loadChildren: () =>
          import('./pages/tables/tables.routes').then((m) => m.TablesRoutes),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'datatable',
        loadChildren: () =>
          import('./pages/datatable/datatable.routes').then(
            (m) => m.DatatablesRoutes
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'theme-pages',
        loadChildren: () =>
          import('./pages/theme-pages/theme-pages.routes').then(
            (m) => m.ThemePagesRoutes
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'billing/blocked',
        component: BillingBlockedComponent,
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'billing/pagamento',
        component: BillingPagamentoComponent,
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'billing/return',
        component: BillingReturnComponent,
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
      {
        path: 'billing/minha-assinatura',
        loadComponent: () =>
          import('./pages/billing/minha-assinatura/minha-assinatura.component').then(
            (m) => m.MinhaAssinaturaComponent
          ),
        canActivate: [AuthGuard],
        data: { perfil: 'GESTOR' },
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: 'landingpage',
        loadChildren: () =>
          import('./pages/theme-pages/landingpage/landingpage.routes').then(
            (m) => m.LandingPageRoutes
          ),
      },
    ],
  },
  {
    path: '',
    component: PrintComponent,
    children: [
      {
        path: 'pedido/imprimir/:id',
        component: ImprimirPedidoComponent
      },
      {
        path: 'pedido/imprimir-duas-vias/:id',
        component: ImprimirPedidoComponent
      },
      {
        path: 'pedido/imprimir-etiquetas/:id',
        component: ImprimirEtiquetasComponent
      },
      {
        path: 'pedido/whatsapp/:id',      
        component: ImprimirWhatsAppComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  }
];
