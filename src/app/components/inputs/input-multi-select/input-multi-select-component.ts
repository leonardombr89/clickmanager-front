import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input, OnChanges, OnInit, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-input-multi-select',
  standalone: true,
  templateUrl: './input-multi-select-component.html',
  styleUrls: ['./input-multi-select-component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatListModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultiSelectComponent implements OnInit, OnChanges {
  @Input() control!: FormControl;
  @Input() label = 'Selecionar';
  @Input() visualStyle: 'default' | 'subtle' = 'default';

  /** SEMPRE passe um novo array ao atualizar (options = [...dados]) */
  @Input() options: { id: any; nome: string }[] = [];
  @Input() searchPlaceholder = 'Buscar opção';
  @Input() showSelectedCount = true;

  /** Layout */
  @Input() cardMinHeight = 220;  // px
  @Input() listHeight = 180;     // px  -> área que terá overflow: auto

  filtroControl = new FormControl('', { nonNullable: true });
  filteredOptions: { id: any; nome: string }[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.control) throw new Error('FormControl obrigatório para <app-input-multi-select>');
    this.aplicarFiltro('');

    this.filtroControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(120)
      )
      .subscribe(value => {
        this.aplicarFiltro(value ?? '');
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.options = [...(this.options ?? [])]; // garante repaint com OnPush
      this.aplicarFiltro(this.filtroControl.value ?? '');
      this.cdr.markForCheck();
    }
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  trackById(_: number, o: { id: any }) { return o.id; }

  errorMessage(): string {
    return this.control?.hasError('required') ? 'Campo obrigatório' : 'Seleção inválida';
  }

  get selectedCount(): number {
    const value = this.control?.value;
    return Array.isArray(value) ? value.length : 0;
  }

  private aplicarFiltro(termo: string): void {
    const filtro = (termo ?? '').trim().toLowerCase();
    this.filteredOptions = !filtro
      ? [...(this.options ?? [])]
      : (this.options ?? []).filter(option =>
          option.nome?.toLowerCase().includes(filtro)
        );
    this.cdr.markForCheck();
  }
}
