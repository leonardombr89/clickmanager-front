import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-catalogo-status-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="catalogo-status-chip" [class.inativo]="!ativo">
      {{ ativo ? 'Ativo' : 'Inativo' }}
    </span>
  `,
  styles: [`
    .catalogo-status-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 10px;
      border-radius: 999px;
      background: #e8f5e9;
      color: #1b5e20;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .catalogo-status-chip.inativo {
      background: #f5f5f5;
      color: #616161;
    }
  `],
})
export class CatalogoStatusChipComponent {
  @Input() ativo?: boolean | null = true;
}
