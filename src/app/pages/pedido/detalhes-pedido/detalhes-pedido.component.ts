import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { PedidoService } from '../pedido.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { TelefonePipe } from "../../../pipe/telefone.pipe";
import { FormaPagamento } from 'src/app/utils/forma-pagamento.enum';
import { InputMoedaComponent } from "../../../components/inputs/input-moeda/input-moeda.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputOptionsComponent } from "../../../components/inputs/input-options/input-options.component";
import { ToastrService } from 'ngx-toastr';
import { PagamentoRequest } from 'src/app/models/pagamento/pagamento-request.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogAdicionarProdutoComponent } from '../dialog-adicionar-produto/dialog-adicionar-produto.component';
import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { ItemTipo } from 'src/app/models/pedido/item-tipo.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SharedComponentsModule } from "src/app/components/shared-components.module";
import { Observable, of } from 'rxjs';
import { catchError, map as rxMap, tap, debounceTime, distinctUntilChanged, switchMap, filter, map } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-detalhes-pedido',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        ReactiveFormsModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        TelefonePipe,
        InputMoedaComponent,
        InputOptionsComponent,
        SharedComponentsModule
    ],
    templateUrl: './detalhes-pedido.component.html'
})
export class DetalhesPedidoComponent implements OnInit {

    form!: FormGroup;

    private readonly route = inject(ActivatedRoute);
    private readonly pedidoService = inject(PedidoService);
    private readonly router = inject(Router);

    trocandoCliente = false;

    trocandoStatus = false;
    carregandoStatus = false;
    statusOptions: string[] = [];

    pedido: PedidoResponse | null = null;
    pedidoItens: PedidoItemRequest[] = [];
    carregando = true;
    salvandoCliente = false;
    adicionandoPagamento = false;
    adicionandoItens = false;

    aprovando = false;

    // controle do autocomplete de cliente
    clienteControl = new FormControl<any | null>(null);

    observacoesControl = new FormControl<string>('', { nonNullable: true });
    salvandoObs = false;
    obsOk = false;

    formasPagamento = Object.values(FormaPagamento);

    obsSub?: Subscription;

    displayedColumnsItens = ['descricao', 'quantidade', 'valor', 'subTotal'];
    displayedColumnsPagamentos = ['forma', 'valor', 'confirmado', 'data'];

    constructor(
        private fb: FormBuilder,
        private toastr: ToastrService,
        private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.form = this.criarFormulario();

        // Reage a mudanças do :id
        this.route.paramMap.pipe(
            rxMap(pm => Number(pm.get('id'))),
            filter(id => !!id && !Number.isNaN(id)),
            switchMap(id => {
                // limpa estado visual enquanto carrega o novo
                this.carregando = true;
                this.pedido = null;
                this.trocandoCliente = false;
                this.trocandoStatus = false;
                this.clienteControl.reset(null, { emitEvent: false });
                this.form.reset({ clienteId: null, status: null });

                return this.pedidoService.buscarPorId(id);
            })
        ).subscribe({
            next: (res) => {
                this.pedido = res;

                // sincronia com o form
                this.form.get('clienteId')?.setValue(this.pedido?.cliente?.id ?? null, { emitEvent: false });
                this.form.get('status')?.setValue(this.pedido?.status ?? null, { emitEvent: false });

                // Observações: inicializa sem disparar auto-save
                this.observacoesControl.setValue(this.pedido?.observacoes ?? '', { emitEvent: false });

                // (re)assina o auto-save uma única vez
                this.obsSub?.unsubscribe();
                this.obsSub = this.observacoesControl.valueChanges.pipe(
                    debounceTime(800),
                    distinctUntilChanged(),
                    switchMap(texto => this.saveObs$(texto ?? ''))
                ).subscribe();

                this.carregando = false;
            },
            error: (err) => {
                console.error('Erro ao carregar pedido:', err);
                this.toastr.error('Não foi possível carregar o pedido.');
                this.carregando = false;
            }
        });

        // carrega opções do back (uma vez)
        this.carregandoStatus = true;
        this.pedidoService.listarStatus().subscribe({
            next: (lista) => this.statusOptions = lista ?? [],
            error: () => this.toastr.error('Não foi possível carregar os status do pedido.'),
        }).add(() => this.carregandoStatus = false);
    }

    ngOnDestroy(): void {
        this.obsSub?.unsubscribe();
    }


    private criarFormulario(): FormGroup {
        // cliente pode ser null no rascunho
        return this.fb.group({
            clienteId: [null],
            status: [null],
            pagamento: this.fb.group({
                valor: [null, Validators.required],
                forma: [null, Validators.required]
            })
        });
    }

    /** Busca para o <app-auto-complete> (retorna {content: []}) */
    buscarClientes = (termo: string): Observable<any[]> =>
        this.pedidoService.buscarClientesPorNome(termo).pipe(map(res => res.content ?? []));

    /** Display do item no autocomplete */
    mostrarCliente = (cliente: any): string =>
        cliente ? `${cliente.nome}${cliente.telefone ? ' - ' + cliente.telefone : ''}` : '';

    /** Salva/atualiza o cliente do pedido a partir do autocomplete */
    salvarClienteDoControle(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const selecionado = this.clienteControl.value;
        const clienteId = selecionado?.id ?? null;

        if (!clienteId) {
            this.toastr.warning('Selecione um cliente antes de salvar.');
            return;
        }

        this.salvandoCliente = true;
        this.pedidoService.atualizar(id, { clienteId } as any).subscribe({
            next: () => {
                this.toastr.success('Cliente atualizado no pedido.');
                this.trocandoCliente = false;
                this.pedidoService.buscarPorId(id).subscribe(p => this.pedido = p);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao atualizar o cliente do pedido.');
            }
        }).add(() => this.salvandoCliente = false);
    }

    /** Fluxo antigo (caso ainda use o input simples de ID) */
    salvarCliente(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const clienteId = this.form.get('clienteId')?.value;
        if (!clienteId) {
            this.toastr.warning('Selecione um cliente antes de salvar.');
            return;
        }

        this.salvandoCliente = true;
        this.pedidoService.atualizar(id, { clienteId } as any).subscribe({
            next: () => {
                this.toastr.success('Cliente atualizado no pedido.');
                this.pedidoService.buscarPorId(id).subscribe(p => this.pedido = p);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao atualizar o cliente do pedido.');
            }
        }).add(() => this.salvandoCliente = false);
    }

    get orcamentoVencido(): boolean {
        const v = this.pedido?.vencimentoOrcamento;
        if (!v) return false;
        // se vier string ISO, Date entende; se vier Date, ok também
        const hoje = new Date();
        const venc = new Date(v);
        // zera horas p/ comparar só a data
        hoje.setHours(0, 0, 0, 0);
        venc.setHours(0, 0, 0, 0);
        return venc.getTime() < hoje.getTime();
    }

    aprovarOrcamento(): void {
        if (!this.pedido?.id) return;

        if (this.orcamentoVencido) {
            this.toastr.warning('Este orçamento está vencido. Gere um novo.', 'Orçamento vencido');
            return;
        }

        this.aprovando = true;
        this.pedidoService.aprovarOrcamento(this.pedido.id).subscribe({
            next: (resp) => {
                this.pedido = resp;
                this.toastr.success('Orçamento aprovado! Pedido gerado.', 'Sucesso');
            },
            error: (err) => {
                const msg = err?.error?.message || 'Não foi possível aprovar o orçamento.';
                this.toastr.error(msg, 'Erro');
            },
            complete: () => (this.aprovando = false)
        });
    }

    trocarCliente(): void {
        this.trocandoCliente = true;
        const atual = this.pedido?.cliente ?? null;
        // se quiser, pode popular o autocomplete com o atual:
        this.clienteControl.setValue(atual);
        // e também sincronizar o campo numérico (se ainda existir no template):
        this.form.get('clienteId')?.setValue(atual?.id ?? null);
    }

    abrirDialogSelecionarCliente(): void {
        this.toastr.info('Use o campo acima para buscar o cliente e clique em "Salvar cliente no pedido".');
    }

    private saveObs$(texto: string) {
        const id = this.pedido?.id;
        if (!id) return of(null);

        if ((this.pedido?.observacoes ?? '') === (texto ?? '')) return of(null);

        this.salvandoObs = true;
        this.obsOk = false;

        return this.pedidoService.atualizar(id, { observacoes: texto } as any).pipe(
            tap(() => {
                this.pedido = { ...(this.pedido as any), observacoes: texto };
                this.obsOk = true;
                setTimeout(() => this.obsOk = false, 1500);
            }),
            catchError(err => {
                this.toastr.error(err?.error?.message ?? 'Falha ao salvar observações.');
                return of(null);
            }),
            tap(() => this.salvandoObs = false)
        );
    }


    salvarObservacoes(): void {
        this.saveObs$(this.observacoesControl.value).subscribe();
    }


    onCriarCliente(): void {
        // volta para a própria tela de pedido depois de criar o cliente
        if (!this.pedido?.id) return;
        this.router.navigate(['/page/cliente/criar'], {
            queryParams: { retorno: `/page/pedido/detalhe/${this.pedido.id}` }
        });
    }

    imprimirEtiqueta(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir-etiquetas/${this.pedido.id}`, '_blank');
    }

    imprimirPedidoCompleto(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir/${this.pedido.id}`, '_blank');
    }

    imprimirPedidoDuasVias(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir-duas-vias/${this.pedido.id}`, '_blank');
    }

    abrirWhatsApp(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de gerar mensagem.');
        }
        window.open(`/pedido/whatsapp/${this.pedido.id}`, '_blank');
    }


    adicionarPagamento(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const valor = this.pagamentoValorControl.value;
        const forma = this.pagamentoFormaControl.value;

        if (!valor || !forma) {
            this.toastr.warning('Preencha todos os campos do pagamento.');
            return;
        }

        const novoPagamento: PagamentoRequest = { forma, valor, confirmado: true };

        this.adicionandoPagamento = true;
        this.pedidoService.adicionarPagamento(id, novoPagamento).subscribe({
            next: () => {
                this.toastr.success('Pagamento adicionado com sucesso.');
                this.pedidoService.buscarPorId(id).subscribe((pedidoAtualizado) => {
                    this.pedido = pedidoAtualizado;
                    this.pagamentoValorControl.reset();
                    this.pagamentoFormaControl.reset();
                });
            },
            error: () => this.toastr.error('Erro ao adicionar pagamento.')
        }).add(() => this.adicionandoPagamento = false);
    }

    onBuscarProdutos(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const dialogRef = this.dialog.open(DialogAdicionarProdutoComponent, {
            panelClass: 'dialog-grande'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && Array.isArray(result)) {
                const itens: PedidoItemRequest[] = [];

                for (const p of result) {
                    const grupoKey =
                        (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

                    const base: PedidoItemRequest = {
                        grupoKey,
                        tipo: ItemTipo.BASE,
                        descricao: p.nome,
                        quantidade: Number(p.quantidade ?? 1),
                        valor: Number(p.valor ?? 0),
                        subTotal: Number(p.subTotal ?? 0),
                        produtoId: p.produtoId,
                        largura: p.largura ?? undefined,
                        altura: p.altura ?? undefined,
                    };
                    itens.push(base);

                    const servicosIds: number[] = p.servicosIds ?? [];
                    for (const sid of servicosIds) {
                        itens.push({
                            grupoKey,
                            tipo: ItemTipo.SERVICO,
                            servicoId: sid,
                            descricao: `Serviço #${sid}`,
                            quantidade: base.quantidade,
                            valor: 0,
                            subTotal: 0,
                            largura: base.largura,
                            altura: base.altura,
                        });
                    }

                    const acabamentosIds: number[] = p.acabamentosIds ?? [];
                    for (const aid of acabamentosIds) {
                        itens.push({
                            grupoKey,
                            tipo: ItemTipo.ACABAMENTO,
                            acabamentoId: aid,
                            descricao: `Acabamento #${aid}`,
                            quantidade: base.quantidade,
                            valor: 0,
                            subTotal: 0,
                            largura: base.largura,
                            altura: base.altura,
                        });
                    }
                }

                this.adicionandoItens = true;
                this.pedidoService.adicionarItens(id, itens).subscribe({
                    next: () => {
                        this.toastr.success('Itens adicionados com sucesso.');
                        this.pedidoService.buscarPorId(id).subscribe(pedidoAtualizado => {
                            this.pedido = pedidoAtualizado;
                        });
                    },
                    error: () => {
                        this.toastr.error('Erro ao adicionar itens ao pedido.');
                    }
                }).add(() => this.adicionandoItens = false);
            }
        });
    }

    iniciarTrocaStatus(): void {
        this.trocandoStatus = true;
        this.statusControl.setValue(this.pedido?.status ?? null);

        // (opcional) carregar on-demand:
        if (!this.statusOptions.length) {
            this.carregandoStatus = true;
            this.pedidoService.listarStatus().subscribe({
                next: (lista) => this.statusOptions = lista ?? [],
                error: () => this.toastr.error('Não foi possível carregar os status do pedido.')
            }).add(() => this.carregandoStatus = false);
        }
    }

    cancelarTrocaStatus(): void {
        this.trocandoStatus = false;
        this.statusControl.reset(this.pedido?.status ?? null);
    }

    salvarStatus(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const novoStatus = this.statusControl.value;
        if (!novoStatus) {
            this.toastr.warning('Selecione um status.');
            return;
        }

        this.carregandoStatus = true;
        this.pedidoService.atualizarStatus(id, novoStatus).subscribe({
            next: (pedidoAtualizado) => {
                this.toastr.success('Status atualizado.');
                this.pedido = pedidoAtualizado; // já vem atualizado do PATCH
                this.trocandoStatus = false;
            },
            error: (err) => {
                console.error(err);
                this.toastr.error(err?.error?.message ?? 'Erro ao atualizar o status.');
            }
        }).add(() => this.carregandoStatus = false);
    }


    onDescreverItens(): void {
        this.toastr.info('Função "Descrever itens" ainda não implementada.');
    }

    // getters de conveniência
    get pagamentoFormaControl(): FormControl {
        return this.form.get(['pagamento', 'forma']) as FormControl;
    }
    get pagamentoValorControl(): FormControl {
        return this.form.get(['pagamento', 'valor']) as FormControl;
    }
    get isRascunho(): boolean {
        return (this.pedido?.status ?? '') === 'RASCUNHO';
    }
    get clienteIdControl(): FormControl {
        return this.form.get('clienteId') as FormControl;
    }
    get statusControl(): FormControl {
        return this.form.get('status') as FormControl;
    }
}

