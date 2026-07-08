import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TipoEmpresa } from 'src/app/models/empresa/tipo-empresa.enum';

export interface SegmentOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  tipoEmpresa: TipoEmpresa;
}

@Component({
  selector: 'app-segment-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segment-selector.component.html',
  styleUrls: ['./segment-selector.component.scss'],
})
export class SegmentSelectorComponent {
  @Input() segments: SegmentOption[] = [];
  @Input() selected: TipoEmpresa | null = null;
  @Output() segmentSelected = new EventEmitter<TipoEmpresa>();

  trackBySegment(index: number, segment: SegmentOption): string {
    return segment.id || String(index);
  }

  isSelected(segment: SegmentOption): boolean {
    return this.selected === segment.tipoEmpresa;
  }

  select(segment: SegmentOption): void {
    this.segmentSelected.emit(segment.tipoEmpresa);
  }

  handleKeydown(event: KeyboardEvent, segment: SegmentOption): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.select(segment);
  }
}
