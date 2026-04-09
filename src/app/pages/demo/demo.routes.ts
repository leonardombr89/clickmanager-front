import { Routes } from '@angular/router';
import { DemoHomeComponent } from './demo-home.component';
import { DemoPedidoComponent } from './demo-pedido.component';
import { DemoShellComponent } from './demo-shell.component';
import { DemoSmartcalcComponent } from './demo-smartcalc.component';
import { DemoWhatsappComponent } from './demo-whatsapp.component';

export const DemoRoutes: Routes = [
  {
    path: '',
    component: DemoShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'smartcalc',
      },
      {
        path: 'como-funciona',
        component: DemoHomeComponent,
        data: {
          demoTitle: 'Como funciona',
          demoEyebrow: 'Demo interativa',
        },
      },
      {
        path: 'smartcalc',
        component: DemoSmartcalcComponent,
        data: {
          demoTitle: 'Monte o item',
          demoEyebrow: 'Passo 1',
        },
      },
      {
        path: 'pedido',
        component: DemoPedidoComponent,
        data: {
          demoTitle: 'Pedido demo',
          demoEyebrow: 'Passo 2',
        },
      },
      {
        path: 'whatsapp',
        component: DemoWhatsappComponent,
        data: {
          demoTitle: 'WhatsApp demo',
          demoEyebrow: 'Passo 3',
        },
      },
    ],
  },
];
