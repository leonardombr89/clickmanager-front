import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './mobile-page-header.component.html',
  styleUrls: ['./mobile-page-header.component.scss'],
})
export class MobilePageHeaderComponent {
  @Input() title = '';
  @Input() showBack = true;
  @Input() backAriaLabel = 'Voltar';
  @Input() badgeText = '';
  @Input() actionIcon = '';
  @Input() actionAriaLabel = 'Ação';

  @Output() back = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  get showActionButton(): boolean {
    return !!this.actionIcon;
  }

  get showBadge(): boolean {
    return !this.showActionButton && !!this.badgeText;
  }
}
