import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputPesquisaComponent } from '../inputs/input-pesquisa/input-pesquisa.component';

export type ListFilterOption = {
  value: string;
  label: string;
};

export type ListFilterDefinition = {
  key: string;
  label: string;
  value: string;
  options: ListFilterOption[];
};

export type ListFilterChange = {
  key: string;
  value: string;
};

@Component({
  selector: 'app-list-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    InputPesquisaComponent,
  ],
  templateUrl: './list-filter-bar.component.html',
  styleUrl: './list-filter-bar.component.scss',
})
export class ListFilterBarComponent {
  @Input() placeholder = 'Digite para pesquisar...';
  @Input() searchValue = '';
  @Input() showSearchLabel = false;
  @Input() filters: ListFilterDefinition[] = [];
  @Input() showClear = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<ListFilterChange>();
  @Output() clear = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value || '');
  }

  onFilterChange(key: string, value: string): void {
    this.filterChange.emit({ key, value });
  }

  trackByFilter(index: number, filter: ListFilterDefinition): string {
    return filter.key || String(index);
  }

  trackByOption(index: number, option: ListFilterOption): string {
    return option.value || String(index);
  }
}
