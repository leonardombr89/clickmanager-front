import { Routes } from '@angular/router';
import { BillingBlockedComponent } from './billing-blocked/billing-blocked.component';
import { BillingPagamentoComponent } from './billing-pagamento/billing-pagamento.component';
import { BillingReturnComponent } from './billing-return/billing-return.component';

export const BillingRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'blocked',
        component: BillingBlockedComponent,
        data: {
          title: 'Assinatura bloqueada',
          urls: [{ title: 'Dashboard', url: '/dashboards/dashboard1' }, { title: 'Assinatura bloqueada' }],
        },
      },
      {
        path: 'pay',
        component: BillingPagamentoComponent,
        data: {
          title: 'Pagamento',
          urls: [{ title: 'Dashboard', url: '/dashboards/dashboard1' }, { title: 'Pagamento' }],
        },
      },
      {
        path: 'pagamento',
        component: BillingPagamentoComponent,
        data: {
          title: 'Pagamento',
          urls: [{ title: 'Dashboard', url: '/dashboards/dashboard1' }, { title: 'Pagamento' }],
        },
      },
      {
        path: 'return',
        component: BillingReturnComponent,
        data: {
          title: 'Retorno de pagamento',
          urls: [{ title: 'Dashboard', url: '/dashboards/dashboard1' }, { title: 'Retorno de pagamento' }],
        },
      },
    ],
  },
];

export default BillingRoutes;
