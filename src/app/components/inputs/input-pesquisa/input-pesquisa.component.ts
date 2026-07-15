import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input-pesquisa',
  standalone: true,
  templateUrl: './input-pesquisa.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputPesquisaComponent implements OnChanges {
  @Input() placeholder = 'Digite para pesquisar...';
  @Input() showLabel = true;
  @Input() value = '';
  @Output() valorAlterado = new EventEmitter<string>();

  pesquisaControl = new FormControl('');

  constructor() {
    this.pesquisaControl.valueChanges
      .pipe(debounceTime(400))
      .subscribe(valor => this.valorAlterado.emit(valor || ''));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.pesquisaControl.value !== this.value) {
      this.pesquisaControl.setValue(this.value || '', { emitEvent: false });
    }
  }
  
}
