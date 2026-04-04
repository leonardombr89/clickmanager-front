import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-input-multi-select',
  standalone: true,
  templateUrl: './input-multi-select-component.html',
  styleUrls: ['./input-multi-select-component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
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
  @Input() hideSelectedFromList = false;

  /** Layout */
  @Input() cardMinHeight = 220;  // px
  @Input() listHeight = 180;     // px  -> área que terá overflow: auto
  @Input() disableListScroll = false;
  @Input() showStickyFooter = false;
  @Input() concludeButtonText = 'Concluir';
  @Input() concludeButtonDisabled = false;
  @Input() footerSelectionLabel = 'selecionado(s)';
  @Output() conclude = new EventEmitter<void>();

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

  get selectedOptions(): { id: any; nome: string }[] {
    const selectedIds = Array.isArray(this.control?.value) ? this.control.value : [];
    return selectedIds
      .map((selectedId: any) => this.options.find(option => String(option.id) === String(this.extractId(selectedId))))
      .filter((option): option is { id: any; nome: string } => !!option);
  }

  get hasVisibleFilteredOptions(): boolean {
    return this.filteredOptions.some(option => !this.shouldHideOption(option));
  }

  removeSelected(optionId: any): void {
    const selectedIds = Array.isArray(this.control?.value) ? [...this.control.value] : [];
    const nextValue = selectedIds.filter((selectedId: any) => String(this.extractId(selectedId)) !== String(this.extractId(optionId)));
    this.control.setValue(nextValue);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.cdr.markForCheck();
  }

  onConclude(): void {
    this.conclude.emit();
  }

  shouldHideOption(option: { id: any; nome: string }): boolean {
    if (!this.hideSelectedFromList) {
      return false;
    }

    const selectedIds = Array.isArray(this.control?.value) ? this.control.value : [];
    return selectedIds.some(selectedId => String(this.extractId(selectedId)) === String(this.extractId(option.id)));
  }

  private aplicarFiltro(termo: string): void {
    const filtro = (termo ?? '').trim().toLowerCase();
    this.filteredOptions = !filtro
      ? [...(this.options ?? [])]
      : (this.options ?? []).filter(option => option.nome?.toLowerCase().includes(filtro));
    this.cdr.markForCheck();
  }

  private extractId(value: any): any {
    if (value && typeof value === 'object' && 'id' in value) {
      return value.id;
    }
    return value;
  }
}
