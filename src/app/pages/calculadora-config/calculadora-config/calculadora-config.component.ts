import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';


type ProdutoOption = { id: number; nome: string };

// 👉 Se já tiver um ProdutoService, use-o. Aqui vai um stub simples.
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalculadoraConfigService } from '../calculadora-config.service';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { CalculadoraConfigRequest } from 'src/app/models/calculadora/calculadora-config-request.model';
import { ProdutoService } from '../../cadastro-tecnico/services/produto.service';

@Component({
    selector: 'app-calculadora-config',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        MatCardModule, MatTabsModule, MatFormFieldModule, MatInputModule,
        MatSlideToggleModule, MatSelectModule, MatButtonModule,
        MatProgressSpinnerModule, MatIconModule
    ],
    templateUrl: './calculadora-config.component.html',
    styleUrls: ['./calculadora-config.component.scss']
})
export class CalculadoraConfigComponent implements OnInit {
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);
    private calculadoraService = inject(CalculadoraConfigService);
    private produtoService = inject(ProdutoService);

    carregando = signal<boolean>(true);
    salvando = signal<boolean>(false);

    produtoOptions: ProdutoOption[] = [];
    configAtual?: CalculadoraConfigResponse;

    // ✅ nonNullable para casar com CalculadoraConfigRequest
    form = this.fb.nonNullable.group({
        ativo: this.fb.nonNullable.control<boolean>(true),
        produtoIds: this.fb.nonNullable.control<number[]>([]),
    });

    ngOnInit(): void {
        const t0 = performance.now();
        console.log('[SmartCalc] init -> carregando produtos...');

        this.produtoService.listarOptionsAtivos()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (opts) => {
                    this.produtoOptions = opts ?? [];
                    console.log('[SmartCalc] produtos recebidos:',
                        { quantidade: this.produtoOptions.length, exemplos: this.produtoOptions.slice(0, 3) });
                },
                error: (err) => {
                    console.error('[SmartCalc] erro ao carregar produtos:', err);
                    this.produtoOptions = [];
                },
                complete: () => {
                    const t1 = performance.now();
                    console.log('[SmartCalc] produtos -> complete',
                        { duracaoMs: Math.round(t1 - t0), carregandoAntes: this.carregando() });

                    this.carregando.set(false);
                    console.log('[SmartCalc] carregando=false; chamando loadConfig()');

                    this.loadConfig();
                }
            });
    }

    private loadConfig(): void {
        const t0 = performance.now();
        console.log('[SmartCalc] loadConfig -> buscando configuração atual...');
        this.carregando.set(true);

        this.calculadoraService.getConfig()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.configAtual = res;
                    const produtos = res?.produtos ?? [];

                    console.log('[SmartCalc] config recebida:', {
                        ativo: res?.ativo,
                        produtosCount: produtos.length,
                        produtosExemplos: produtos.slice(0, 3)
                    });

                    const produtoIds = produtos
                        .map(p => p?.id)
                        .filter((id): id is number => typeof id === 'number');

                    console.log('[SmartCalc] mapeamento ProdutoOption -> ids:', {
                        idsCount: produtoIds.length,
                        idsExemplos: produtoIds.slice(0, 5)
                    });

                    this.form.patchValue({
                        ativo: res?.ativo ?? true,
                        produtoIds,
                    });

                    console.log('[SmartCalc] form.patchValue aplicado:', this.form.getRawValue());
                },
                error: (err) => {
                    console.error('[SmartCalc] erro ao carregar config:', err);
                },
                complete: () => {
                    const t1 = performance.now();
                    this.carregando.set(false);
                    console.log('[SmartCalc] loadConfig -> complete', {
                        duracaoMs: Math.round(t1 - t0),
                        carregandoAtual: this.carregando(),
                        formValue: this.form.getRawValue()
                    });
                }
            });
    }


    private mapNomesToIds(nomes?: string[]): number[] {
        if (!nomes?.length) return [];
        const byName = new Map(this.produtoOptions.map(p => [p.nome, p.id]));
        return nomes.map(n => byName.get(n)).filter((v): v is number => typeof v === 'number');
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const req: CalculadoraConfigRequest = this.form.getRawValue(); // tipos casam por ser nonNullable
        this.salvando.set(true);

        this.calculadoraService.salvar(req)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.configAtual = res;
                    // opcional: snackbar "Salvo com sucesso"
                },
                error: () => {
                    // opcional: snackbar de erro
                },
                complete: () => this.salvando.set(false)
            });
    }

    trackById = (_: number, item: ProdutoOption) => item.id;
}