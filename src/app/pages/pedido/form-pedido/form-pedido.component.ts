import { Component, signal, computed, OnInit } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormArray,
  FormBuilder
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PedidoService } from '../pedido.service';
import { SharedComponentsModule } from "../../../components/shared-components.module";
import { map, Observable, take } from 'rxjs';
import { DialogAdicionarProdutoComponent } from '../dialog-adicionar-produto/dialog-adicionar-produto.component';
import { DialogDescreverItemComponent } from '../dialog-descrever-item/dialog-descrever-item.component';
import { PedidoRequest } from 'src/app/models/pedido/pedido-request.model';
import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { AuthService } from 'src/app/services/auth.service';
import { InputTextareaComponent } from "../../../components/inputs/input-textarea/input-textarea.component";
import { FormaPagamento } from 'src/app/utils/forma-pagamento.enum';
import { InputOptionsComponent } from "../../../components/inputs/input-options/input-options.component";
import { ToastrService } from 'ngx-toastr';
import { InputDataComponent } from "../../../components/inputs/input-data/input-data.component";
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { ItemTipo } from 'src/app/models/pedido/item-tipo.enum';

@Component({
  selector: 'app-form-pedido',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    SharedComponentsModule,
    InputTextareaComponent,
    InputOptionsComponent,
    InputDataComponent
  ],
  templateUrl: './form-pedido.component.html',
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate(
          '300ms ease-out',
          style({ height: '*', opacity: 1, overflow: 'hidden' })
        )
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate(
          '300ms ease-in',
          style({ height: 0, opacity: 0, overflow: 'hidden' })
        )
      ])
    ])
  ]
})
export class FormPedidoComponent implements OnInit {

  addForm!: FormGroup;
  rows!: FormArray;
  pedidoItens: PedidoItemRequest[] = [];

  produtoControl = new FormControl();

  subTotal = 0;
  totalAjustado = 0;
  restaPagar = 0;
  grandTotal = 0;

  usuario$ = this.authService.usuario$;
  formasPagamento = Object.values(FormaPagamento);

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.addForm = this.fb.group({
      clienteId: [null, Validators.required],
      acrescimo: [0],
      frete: [0],
      desconto: [0],
      observacoes: [''],
      pagamentos: this.fb.array([]),
      orcamento: [false],
      nomeOrcamento: [''],
      vencimentoOrcamento: [null]
    });

    this.rows = this.fb.array([]);
    this.rows.push(this.createItemFormGroup());

    this.addPagamento()

    this.addForm.valueChanges.subscribe(() => this.recalcularTotais());

    this.clienteControl.valueChanges.subscribe(cliente => {
      if (cliente?.id) {
        this.addForm.get('clienteId')?.setValue(cliente.id);
      }
    });
  }

  addPagamento(): void {
    const pagamentosArray = this.addForm.get('pagamentos') as FormArray;

    // Verifica se já atingiu o número máximo de formas de pagamento
    if (pagamentosArray.length >= this.formasPagamento.length) {
      this.toastr.warning('Você já adicionou todas as formas de pagamento disponíveis.');
      return;
    }

    pagamentosArray.push(this.fb.group({
      forma: [''],
      valor: [0]
    }));
  }

  removerPagamento(index: number): void {
    const pagamentosArray = this.pagamentos;
    pagamentosArray.removeAt(index);

    if (pagamentosArray.length === 0) {
      this.addPagamento();
    }
  }

  recalcularTotais(): void {
    // Subtotal: soma dos subtotais dos itens (ou valor×qtd como fallback)
    this.subTotal = this.pedidoItens.reduce((acc, item: any) => {
      const st = Number(item.subTotal ?? (Number(item.valor ?? 0) * Number(item.quantidade ?? 0)));
      return acc + st;
    }, 0);

    const acrescimo = Number(this.addForm.get('acrescimo')?.value || 0);
    const frete = Number(this.addForm.get('frete')?.value || 0);
    const desconto = Number(this.addForm.get('desconto')?.value || 0);

    this.totalAjustado = this.subTotal + acrescimo + frete - desconto;

    const pagamentosArray = this.addForm.get('pagamentos') as FormArray;
    const totalPagamentos = pagamentosArray.controls.reduce((acc, grupo) => {
      const valor = Number(grupo.get('valor')?.value || 0);
      return acc + valor;
    }, 0);

    this.restaPagar = this.totalAjustado - totalPagamentos;
    this.grandTotal = this.totalAjustado;
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      itemName: ['', Validators.required],
      units: ['', Validators.required],
      unitPrice: ['', Validators.required],
      itemTotal: ['0']
    });
  }

  onAddRow(): void {
    this.rows.push(this.createItemFormGroup());
  }

  onRemoveRow(index: number): void {
    this.rows.removeAt(index);
  }

  buscarProdutos = (termo: string): Observable<any[]> =>
    this.pedidoService.buscarProdutosPorNome(termo).pipe(map(res => res.content));

  buscarClientes = (termo: string): Observable<any[]> =>
    this.pedidoService.buscarClientesPorNome(termo).pipe(map(res => res.content));

  mostrarProduto = (produto: any): string =>
    produto ? `${produto.nome}${produto.descricao ? ' - ' + produto.descricao : ''}` : '';

  mostrarCliente = (cliente: any): string =>
    cliente ? `${cliente.nome}${cliente.telefone ? ' - ' + cliente.telefone : ''}` : '';

  onBuscarProdutos(): void {
    const dialogRef = this.dialog.open(DialogAdicionarProdutoComponent, {
      panelClass: 'dialog-grande'
    });

    dialogRef.afterClosed().subscribe((result: any[] | null) => {
      if (!Array.isArray(result) || result.length === 0) return;

      const novos: PedidoItemRequest[] = [];

      for (const p of result) {
        // quantidade/medidas/valores seguros vindos do diálogo
        const quantidade = Number(p.quantidade ?? 1) || 1;
        const unitario = Number(p.valor ?? 0) || 0;
        const subTotal = Number(p.subTotal ?? (unitario * quantidade)) || 0;
        const largura = p.largura ?? null;
        const altura = p.altura ?? null;

        // chave do grupo (BASE + FILHOS)
        const grupoKey = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

        const variacaoId: number | undefined =
          p.produtoVariacaoId ?? p.variacaoId ?? undefined;

        if (!variacaoId) {
          this.toastr.error('Selecione a variação (material/formato) do produto antes de adicionar.');
          continue;
        }

        // 1) BASE
        const base: PedidoItemRequest = {
          grupoKey,
          tipo: ItemTipo.BASE,
          descricao: p.nome ?? p.descricao ?? 'Item',
          quantidade,
          valor: unitario,
          subTotal,
          produtoVariacaoId: variacaoId,
          largura,
          altura,
        };
        novos.push(base);

        // 2) FILHOS — SERVIÇOS (cria 1 por id)
        const servicosIds: number[] = p.servicosIds ?? (p.servicoId ? [p.servicoId] : []);
        for (const sid of servicosIds) {
          novos.push({
            grupoKey,
            tipo: ItemTipo.SERVICO,
            servicoId: sid,
            descricao: p.servicos?.find((s: any) => s.id === sid)?.nome ?? `Serviço #${sid}`,
            quantidade: quantidade, // herda do base
            valor: 0,
            subTotal: 0,
            largura,
            altura,
          });
        }

        // 3) FILHOS — ACABAMENTOS (cria 1 por id)
        const acabamentosIds: number[] = p.acabamentosIds ?? (p.acabamentoId ? [p.acabamentoId] : []);
        for (const aid of acabamentosIds) {
          novos.push({
            grupoKey,
            tipo: ItemTipo.ACABAMENTO,
            acabamentoId: aid,
            descricao: p.acabamentos?.find((a: any) => a.id === aid)?.nome ?? `Acabamento #${aid}`,
            quantidade: quantidade,
            valor: 0,
            subTotal: 0,
            largura,
            altura,
          });
        }
      }

      this.pedidoItens = [...this.pedidoItens, ...novos];
      this.recalcularTotais();
    });

  }

  onDescreverItens(): void {
    const dialogRef = this.dialog.open(DialogDescreverItemComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((item: any) => {
      if (item?.descricao && item.quantidade && item.valorUnitario != null) {
        const quantidade = Number(item.quantidade) || 1;
        const valor = Number(item.valorUnitario) || 0;

        // chave do grupo (mesmo que não tenha filhos agora, já deixamos preparado)
        const grupoKey = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());

        const novoItem: PedidoItemRequest = {
          grupoKey,
          tipo: ItemTipo.MANUAL,
          descricao: item.descricao,
          quantidade,
          valor,
          subTotal: valor * quantidade
        };

        this.pedidoItens = [...this.pedidoItens, novoItem];
        this.recalcularTotais();
      }
    });
  }

  removerItem(index: number): void {
    this.pedidoItens.splice(index, 1);
    this.recalcularTotais();
  }

  onCriarCliente(): void {
    this.router.navigate(['/page/cliente/criar'], {
      queryParams: { retorno: '/page/pedido/criar' }
    });
  }

  saveDetail(event: Event): void {
    event.preventDefault();

    const form = this.addForm.value;

    if (!form.clienteId || this.pedidoItens.length === 0) {
      this.toastr.warning('Selecione um cliente e adicione pelo menos um item.');
      return;
    }

    this.usuario$.pipe(take(1)).subscribe(usuario => {
      if (!usuario?.id) {
        this.toastr.error('Usuário não identificado!');
        return;
      }

      const isOrcamento: boolean = !!form.orcamento;

      // só considera pagamentos quando NÃO for orçamento
      const pagamentosValidos = !isOrcamento
        ? (form.pagamentos || []).filter((p: any) => p.forma && p.valor && p.valor > 0)
        : [];

      const pedido: PedidoRequest = {
        clienteId: typeof form.clienteId === 'object' ? form.clienteId.id : form.clienteId,
        itens: this.pedidoItens,
        acrescimo: form.acrescimo,
        frete: form.frete,
        desconto: form.desconto,
        observacoes: form.observacoes,
        pagamentos: pagamentosValidos,
        responsavelId: usuario.id,

        orcamento: isOrcamento,
        nomeOrcamento: isOrcamento ? (form.nomeOrcamento || null) : null,
        vencimentoOrcamento: isOrcamento && form.vencimentoOrcamento
          ? this.toIsoDate(form.vencimentoOrcamento)
          : null,
      };

      this.pedidoService.salvar(pedido).subscribe({
        next: () => {
          this.toastr.success(isOrcamento ? 'Orçamento salvo com sucesso!' : 'Pedido salvo com sucesso!');
          this.router.navigate(['/page/pedido']);
        },
        error: () => {
          this.toastr.error('Erro ao salvar.');
        }
      });
    });
  }

  // helper simples para ISO (ajuste conforme seu InputDataComponent)
  private toIsoDate(d: any): string {
    // se já vier Date:
    if (d instanceof Date) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    // se vier string DD/MM/YYYY:
    if (typeof d === 'string' && d.includes('/')) {
      const [dd, mm, yyyy] = d.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    // fallback (já ISO)
    return d;
  }

  get acrescimoControl(): FormControl {
    return this.addForm.get('acrescimo') as FormControl;
  }

  get freteControl(): FormControl {
    return this.addForm.get('frete') as FormControl;
  }

  get descontoControl(): FormControl {
    return this.addForm.get('desconto') as FormControl;
  }

  get observacoesControl(): FormControl {
    return this.addForm.get('observacoes') as FormControl;
  }

  get pagamentos(): FormArray {
    return this.addForm.get('pagamentos') as FormArray;
  }

  get pagamentosControls(): FormGroup[] {
    return this.pagamentos.controls as FormGroup[];
  }

  get clienteControl(): FormControl {
    return this.addForm.get('clienteId') as FormControl
  }

  get orcamentoControl(): FormControl {
    return this.addForm.get('orcamento') as FormControl;
  }

  get nomeOrcamentoControl(): FormControl {
    return this.addForm.get('nomeOrcamento') as FormControl;
  }

  get vencimentoOrcamentoControl(): FormControl {
    return this.addForm.get('vencimentoOrcamento') as FormControl;
  }

  getFormaPagamentoControl(pg: FormGroup): FormControl {
    return pg.get('forma') as FormControl;
  }

  getPagamentoValorControl(index: number): FormControl {
    return this.pagamentosControls[index].get('valor') as FormControl;
  }

}



