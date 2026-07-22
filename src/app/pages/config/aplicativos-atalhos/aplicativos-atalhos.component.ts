import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import {
  APLICATIVOS_CATALOGO,
  AplicativoEmpresa,
  AplicativoSistema,
  AtalhoEmpresa,
  ConfiguracaoAplicativos,
} from 'src/app/models/config/configuracao-aplicativos.model';
import { PermissaoChave } from 'src/app/models/permissao.model';
import { AuthService } from 'src/app/services/auth.service';
import { ConfiguracaoAplicativosService } from 'src/app/services/configuracao-aplicativos.service';

type AtalhoForm = {
  id: FormControl<number | null>;
  nome: FormControl<string>;
  url: FormControl<string>;
  novaAba: FormControl<boolean>;
  ativo: FormControl<boolean>;
  ordem: FormControl<number>;
};

type AtalhoFormGroup = FormGroup<AtalhoForm>;

type AplicativoForm = {
  aplicativo: FormControl<AplicativoSistema>;
  ativo: FormControl<boolean>;
};

type AplicativoFormGroup = FormGroup<AplicativoForm>;

@Component({
  selector: 'app-aplicativos-atalhos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, PageCardComponent, SectionCardComponent],
  templateUrl: './aplicativos-atalhos.component.html',
  styleUrls: ['./aplicativos-atalhos.component.scss'],
})
export class AplicativosAtalhosComponent implements OnInit {
  readonly aplicativosCatalogo = APLICATIVOS_CATALOGO;
  readonly form = this.fb.group({
    aplicativos: this.fb.array<AplicativoFormGroup>(
      this.aplicativosCatalogo.map((app) =>
        this.fb.group<AplicativoForm>({
          aplicativo: this.fb.nonNullable.control<AplicativoSistema>(app.aplicativo),
          ativo: this.fb.nonNullable.control(false),
        })
      )
    ),
    atalhos: this.fb.array<AtalhoFormGroup>([]),
  });
  carregando = false;
  salvando = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly configuracaoService: ConfiguracaoAplicativosService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    if (!this.podeEditar) {
      this.form.disable({ emitEvent: false });
    }

    this.carregar();
  }

  get aplicativos(): FormArray<AplicativoFormGroup> {
    return this.form.controls.aplicativos;
  }

  get atalhos(): FormArray<AtalhoFormGroup> {
    return this.form.controls.atalhos;
  }

  get podeEditar(): boolean {
    return this.authService.temPermissao(PermissaoChave.CONFIGURACOES_APLICATIVOS_ATALHOS_EDITAR);
  }

  get podeSalvar(): boolean {
    return this.podeEditar && !this.carregando && !this.salvando && this.form.valid;
  }

  adicionarAtalho(): void {
    if (!this.podeEditar) return;
    const ultimaOrdem = this.atalhos.controls.reduce(
      (max: number, control: AtalhoFormGroup) => Math.max(max, control.controls.ordem.value),
      0
    );
    this.atalhos.push(this.criarAtalhoForm({ nome: '', url: '', novaAba: true, ativo: true, ordem: ultimaOrdem + 1 }));
  }

  removerAtalho(index: number): void {
    if (!this.podeEditar) return;
    this.atalhos.removeAt(index);
    this.reordenarAtalhos();
  }

  salvar(): void {
    if (!this.podeEditar) {
      this.toastr.warning('Você não possui permissão para editar aplicativos e atalhos.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.configuracaoService.salvar(this.buildPayload()).subscribe({
      next: (configuracao) => {
        this.salvando = false;
        this.preencherFormulario(configuracao);
        this.toastr.success('Aplicativos e atalhos atualizados com sucesso.');
      },
      error: (err) => {
        this.salvando = false;
        this.toastr.error(err?.userMessage || 'Erro ao salvar aplicativos e atalhos.');
      },
    });
  }

  private carregar(): void {
    this.carregando = true;
    this.configuracaoService.carregar().subscribe({
      next: (configuracao) => {
        this.carregando = false;
        this.preencherFormulario(configuracao);
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Erro ao carregar aplicativos e atalhos.');
      },
    });
  }

  private preencherFormulario(configuracao: ConfiguracaoAplicativos): void {
    const aplicativosPorChave = new Map<AplicativoSistema, AplicativoEmpresa>(
      (configuracao.aplicativos || []).map((app) => [app.aplicativo, app])
    );

    this.form.controls.aplicativos.controls.forEach((control) => {
      const aplicativo = control.controls.aplicativo.value;
      control.patchValue({ ativo: aplicativosPorChave.get(aplicativo)?.ativo ?? false }, { emitEvent: false });
    });

    this.atalhos.clear();
    (configuracao.atalhos || [])
      .slice()
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .forEach((atalho, index) => {
        this.atalhos.push(this.criarAtalhoForm({ ...atalho, ordem: atalho.ordem ?? index + 1 }));
      });

    if (!this.podeEditar) {
      this.form.disable({ emitEvent: false });
    }
  }

  private buildPayload(): ConfiguracaoAplicativos {
    return {
      aplicativos: this.form.controls.aplicativos.controls.map((control) => ({
        aplicativo: control.controls.aplicativo.value,
        ativo: control.controls.ativo.value,
      })),
      atalhos: this.atalhos.controls.map((control, index) => ({
        id: control.controls.id.value ?? undefined,
        nome: control.controls.nome.value.trim(),
        url: control.controls.url.value.trim(),
        novaAba: control.controls.novaAba.value,
        ativo: control.controls.ativo.value,
        ordem: control.controls.ordem.value || index + 1,
      })),
    };
  }

  private criarAtalhoForm(atalho?: Partial<AtalhoEmpresa>): AtalhoFormGroup {
    return this.fb.group<AtalhoForm>({
      id: this.fb.control(atalho?.id ?? null),
      nome: this.fb.nonNullable.control(atalho?.nome ?? '', [Validators.required, Validators.maxLength(60)]),
      url: this.fb.nonNullable.control(atalho?.url ?? '', [Validators.required, Validators.maxLength(240), Validators.pattern(/^https?:\/\/.+/i)]),
      novaAba: this.fb.nonNullable.control(atalho?.novaAba ?? true),
      ativo: this.fb.nonNullable.control(atalho?.ativo ?? true),
      ordem: this.fb.nonNullable.control(atalho?.ordem ?? this.atalhos.length + 1),
    });
  }

  private reordenarAtalhos(): void {
    this.atalhos.controls.forEach((control: AtalhoFormGroup, index: number) => {
      control.controls.ordem.setValue(index + 1, { emitEvent: false });
    });
  }
}
