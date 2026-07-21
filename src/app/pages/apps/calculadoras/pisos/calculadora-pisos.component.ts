import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import {
  CalculadoraPisoAmbienteRequest,
  CalculadoraPisoProduto,
  CalculadoraPisoResultado,
} from './calculadora-pisos.models';
import { CalculadoraPisosService } from './calculadora-pisos.service';

type AmbienteForm = FormGroup<{
  nome: FormControl<string>;
  largura: FormControl<string>;
  comprimento: FormControl<string>;
  quantidade: FormControl<number>;
}>;

@Component({
  selector: 'app-calculadora-pisos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent],
  templateUrl: './calculadora-pisos.component.html',
  styleUrls: ['./calculadora-pisos.component.scss'],
})
export class CalculadoraPisosComponent implements OnInit {
  buscaProduto = new FormControl<string | CalculadoraPisoProduto>('');
  produtos$!: Observable<CalculadoraPisoProduto[]>;
  produtoSelecionado: CalculadoraPisoProduto | null = null;
  carregandoProduto = false;
  calculando = false;
  adicionando = false;
  erro = '';
  sucesso = '';
  resultadoDesatualizado = false;
  resultado: CalculadoraPisoResultado | null = null;
  modoOrcamento = new FormControl<'EXISTENTE' | 'NOVO'>('EXISTENTE', { nonNullable: true });
  orcamentoId = new FormControl<number | null>(null);
  perdaOptions = [0, 5, 10, 15];

  form = this.fb.group({
    percentualPerda: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    ambientes: this.fb.array<AmbienteForm>([]),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CalculadoraPisosService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.addAmbiente();
    this.produtos$ = this.buscaProduto.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        const termo = typeof value === 'string' ? value : value?.nome || '';
        if (!termo || termo.length < 2) return of([]);
        this.carregandoProduto = true;
        return this.service.buscarProdutos(termo).pipe(
          catchError(() => {
            this.erro = 'Não foi possível buscar produtos compatíveis.';
            return of([]);
          }),
          finalize(() => (this.carregandoProduto = false))
        );
      })
    );

    this.form.valueChanges.subscribe(() => {
      if (this.resultado) this.resultadoDesatualizado = true;
      this.sucesso = '';
    });
  }

  get ambientes(): FormArray<AmbienteForm> {
    return this.form.controls.ambientes;
  }

  get podeAdicionarOrcamento(): boolean {
    return this.auth.temPermissao('CALCULADORA_PISOS_ADICIONAR_ORCAMENTO');
  }

  displayProduto(produto?: string | CalculadoraPisoProduto | null): string {
    return typeof produto === 'string' ? produto : produto ? `${produto.codigo} - ${produto.nome}` : '';
  }

  selecionarProduto(event: MatAutocompleteSelectedEvent): void {
    const produto = event.option.value as CalculadoraPisoProduto;
    this.produtoSelecionado = produto;
    this.resultado = null;
    this.resultadoDesatualizado = false;
    this.erro = '';
    this.form.patchValue({ percentualPerda: produto.perdaPadraoPercentual ?? 0 });
  }

  addAmbiente(base?: Partial<CalculadoraPisoAmbienteRequest>): void {
    this.ambientes.push(this.fb.group({
      nome: this.fb.control(base?.nome || `Ambiente ${this.ambientes.length + 1}`, { nonNullable: true, validators: [Validators.required] }),
      largura: this.fb.control(this.formatInput(base?.largura), { nonNullable: true, validators: [Validators.required] }),
      comprimento: this.fb.control(this.formatInput(base?.comprimento), { nonNullable: true, validators: [Validators.required] }),
      quantidade: this.fb.control(base?.quantidade || 1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    }));
  }

  duplicarAmbiente(index: number): void {
    const item = this.ambientePayload(this.ambientes.at(index));
    this.addAmbiente({ ...item, nome: `${item.nome} copia` });
  }

  removerAmbiente(index: number): void {
    if (this.ambientes.length === 1) {
      this.toastr.warning('A calculadora precisa de ao menos um ambiente.');
      return;
    }
    this.ambientes.removeAt(index);
  }

  areaAmbiente(form: AmbienteForm): number {
    const largura = this.parseDecimal(form.controls.largura.value);
    const comprimento = this.parseDecimal(form.controls.comprimento.value);
    const quantidade = Number(form.controls.quantidade.value || 0);
    return largura > 0 && comprimento > 0 && quantidade > 0 ? largura * comprimento * quantidade : 0;
  }

  calcular(): void {
    this.erro = '';
    this.sucesso = '';
    this.form.markAllAsTouched();

    if (!this.produtoSelecionado) {
      this.erro = 'Selecione um produto compatível com a calculadora.';
      return;
    }
    if (!this.produtoSelecionado.ativo) {
      this.erro = 'Produto inativo não pode ser calculado.';
      return;
    }
    if (!this.produtoSelecionado.metragemPorEmbalagem || this.produtoSelecionado.metragemPorEmbalagem <= 0) {
      this.erro = 'Este produto ainda não possui metragem por embalagem configurada.';
      return;
    }

    const ambientes = this.ambientes.controls.map((item) => this.ambientePayload(item));
    if (ambientes.some((item) => item.largura <= 0 || item.comprimento <= 0 || item.quantidade <= 0)) {
      this.erro = 'Informe medidas maiores que zero em todos os ambientes.';
      return;
    }

    this.calculando = true;
    this.service.calcular({
      produtoId: this.produtoSelecionado.id,
      percentualPerda: Number(this.form.value.percentualPerda || 0),
      ambientes,
    }).pipe(
      finalize(() => (this.calculando = false))
    ).subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.resultadoDesatualizado = false;
      },
      error: () => {
        this.erro = 'Não foi possível calcular no backend. Revise os dados e tente novamente.';
      },
    });
  }

  adicionarAoOrcamento(): void {
    if (!this.resultado || this.resultadoDesatualizado || !this.podeAdicionarOrcamento) return;
    const criarNovoOrcamento = this.modoOrcamento.value === 'NOVO';
    if (!criarNovoOrcamento && !this.orcamentoId.value) {
      this.toastr.warning('Informe o orçamento que receberá o item.');
      return;
    }
    this.adicionando = true;
    this.service.adicionarAoOrcamento({
      criarNovoOrcamento,
      orcamentoId: criarNovoOrcamento ? null : this.orcamentoId.value,
      resultado: this.resultado,
    }).pipe(finalize(() => (this.adicionando = false))).subscribe({
      next: (res) => {
        this.sucesso = res.mensagem || 'Item adicionado ao orçamento.';
        if (res.pedidoId) this.router.navigate(['/page/orcamentos', res.pedidoId]);
      },
      error: () => {
        this.erro = 'Não foi possível adicionar o item ao orçamento.';
      },
    });
  }

  avisosLocais(): string[] {
    const avisos: string[] = [];
    if (this.produtoSelecionado && this.produtoSelecionado.precoUnitario == null) avisos.push('Preço indisponível.');
    if (Number(this.form.value.percentualPerda || 0) > 25) avisos.push('Percentual de perda alto.');
    if (this.resultado?.sobraEstimada && this.resultado.sobraEstimada > (this.produtoSelecionado?.metragemPorEmbalagem || 1)) avisos.push('Sobra estimada elevada.');
    if (this.resultado?.quantidadeCaixas && this.resultado.quantidadeCaixas > 500) avisos.push('Quantidade muito grande.');
    return [...avisos, ...(this.resultado?.avisos || [])];
  }

  formatNumber(value?: number | null): string {
    return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private ambientePayload(form: AmbienteForm): CalculadoraPisoAmbienteRequest {
    return {
      nome: form.controls.nome.value,
      largura: this.parseDecimal(form.controls.largura.value),
      comprimento: this.parseDecimal(form.controls.comprimento.value),
      quantidade: Number(form.controls.quantidade.value || 0),
    };
  }

  private parseDecimal(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Number(String(value).replace(',', '.')) || 0;
  }

  private formatInput(value?: number | null): string {
    return value ? String(value).replace('.', ',') : '';
  }
}
