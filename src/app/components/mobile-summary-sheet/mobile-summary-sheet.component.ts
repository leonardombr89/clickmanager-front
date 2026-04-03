import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-mobile-summary-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-summary-sheet.component.html',
  styleUrls: ['./mobile-summary-sheet.component.scss'],
  animations: [
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('220ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('sheetMotion', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(18px) scale(0.985)'
        }),
        animate('240ms cubic-bezier(0.22, 1, 0.36, 1)', style({
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }))
      ]),
      transition(':leave', [
        animate('190ms cubic-bezier(0.4, 0, 1, 1)', style({
          opacity: 0,
          transform: 'translateY(14px) scale(0.99)'
        }))
      ])
    ])
  ]
})
export class MobileSummarySheetComponent {
  @Input() open = false;
  @Input() bottomOffset = '0px';
  @Input() backdropZIndex = 58;
  @Input() sheetZIndex = 59;
  @Input() closeAriaLabel = 'Fechar painel';

  @Output() close = new EventEmitter<void>();

  emitClose(): void {
    this.close.emit();
  }
}
