import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SectionCardComponent } from '../section-card/section-card.component';
import { InputOptionsComponent } from '../inputs/input-options/input-options.component';
import { SharedComponentsModule } from '../shared-components.module';

@Component({
  selector: 'app-pagamentos-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    SectionCardComponent,
    InputOptionsComponent,
    SharedComponentsModule
  ],
  templateUrl: './pagamentos-section.component.html',
  styleUrls: ['./pagamentos-section.component.scss']
})
export class PagamentosSectionComponent {
  @Input() pagamentoNovo!: FormGroup;
  @Input() pagamentosControls: FormGroup[] = [];
  @Input() formasPagamento: any[] = [];
  @Input() pago: number = 0;
  @Input() restante: number = 0;

  @Output() addPagamento = new EventEmitter<void>();
  @Output() removerPagamento = new EventEmitter<number>();

  get formaControl(): FormControl {
    return this.pagamentoNovo.get('forma') as FormControl;
  }

  get valorControl(): FormControl {
    return this.pagamentoNovo.get('valor') as FormControl;
  }
}
