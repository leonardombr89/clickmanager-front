import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-tabela-generica',
  templateUrl: './tabela-generica.component.html',
  styleUrls: ['./tabela-generica.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule
  ]
})
export class TabelaGenericaComponent {
  @Input() displayedColumns: string[] = [];
  @Input() dados: any[] = [];
  @Input() totalRegistros = 0;
  @Input() pageSize = 10;
  @Input() loading = false;

  @Output() paginar = new EventEmitter<PageEvent>();
  @Output() filtrar = new EventEmitter<string>();
  @Output() editar = new EventEmitter<any>();
  @Output() excluir = new EventEmitter<any>();

  filtro: string = '';

  onFiltrar(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filtro = value;
    this.filtrar.emit(value);
  }

  onPaginar(event: PageEvent): void {
    this.paginar.emit(event);
  }

  onEditar(item: any): void {
    this.editar.emit(item);
  }

  onExcluir(item: any): void {
    this.excluir.emit(item);
  }
}