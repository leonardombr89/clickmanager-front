import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const normalized = value.toString().replace(/_/g, ' ').toLowerCase();
    return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
