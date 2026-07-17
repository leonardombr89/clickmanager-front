import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { StorageArquivosListaComponent } from '../storage-arquivos-lista/storage-arquivos-lista.component';
import { StorageDashboardComponent } from '../storage-dashboard/storage-dashboard.component';
import { StorageLixeiraComponent } from '../storage-lixeira/storage-lixeira.component';
import { StorageReconciliacaoComponent } from '../storage-reconciliacao/storage-reconciliacao.component';
import { StorageVideosComponent } from '../storage-videos/storage-videos.component';

@Component({
  selector: 'app-storage-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageCardComponent,
    StorageArquivosListaComponent,
    StorageDashboardComponent,
    StorageLixeiraComponent,
    StorageReconciliacaoComponent,
    StorageVideosComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './storage-admin-page.component.html',
  styleUrl: './storage-admin-page.component.scss',
})
export class StorageAdminPageComponent {}
