import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-total-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './mobile-total-bar.component.html',
  styleUrls: ['./mobile-total-bar.component.scss'],
})
export class MobileTotalBarComponent {
  @Input() label = 'Total estimado';
  @Input() valueText = '';
  @Input() detailText = 'Ver detalhes';
  @Input() expanded = false;
  @Input() loading = false;
  @Input() actionText = '';
  @Input() actionDisabled = false;
  @Input() expandAriaLabel = 'Ver detalhes do cálculo';
  @Input() actionAriaLabel = 'Executar ação principal';
  @Input() bottomOffset = '0px';
  @Input() attachedToBottomNav = false;

  @Output() expand = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  private touchStartY: number | null = null;

  onRootClick(): void {
    this.expand.emit();
  }

  onRootKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.expand.emit();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.changedTouches[0]?.clientY ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartY == null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? this.touchStartY;
    const deltaY = this.touchStartY - endY;
    this.touchStartY = null;

    if (deltaY > 24) {
      this.expand.emit();
    }
  }

  onActionClick(event: Event): void {
    event.stopPropagation();
    this.action.emit();
  }
}
