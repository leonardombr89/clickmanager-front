import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-fab-action',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './mobile-fab-action.component.html',
  styleUrls: ['./mobile-fab-action.component.scss']
})
export class MobileFabActionComponent {
  @Input() label = '';
  @Input() icon = 'add';
  @Input() compact = false;
  @Input() ariaLabel = '';
  @Output() action = new EventEmitter<void>();

  emitAction(): void {
    this.action.emit();
  }
}
