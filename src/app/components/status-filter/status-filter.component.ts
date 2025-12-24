import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-status-filter',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './status-filter.component.html',
})
export class StatusFilterComponent {

  @Input() title = 'Status';
  @Input() selected: boolean | null = null;
  @Input() labelAtivos = 'Ativos';
  @Input() labelInativos = 'Inativos';
  @Input() labelTodos = 'Todos';

  @Output() selectionChange = new EventEmitter<boolean | null>();

  onSelect(value: boolean | null): void {
    this.selected = value;
    this.selectionChange.emit(value);
  }
}
