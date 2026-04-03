import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-sheet-header',
  standalone: true,
  templateUrl: './mobile-sheet-header.component.html',
  styleUrls: ['./mobile-sheet-header.component.scss'],
})
export class MobileSheetHeaderComponent {
  @Input() title = '';
  @Input() hint = '';
}
