import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'ngx-toastr';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PermissaoCatalogo } from 'src/app/models/permissao.model';

interface RecursoPermissaoView {
  codigo: string;
  titulo: string;
  permissoes: PermissaoCatalogo[];
}

interface ModuloPermissaoView {
  codigo: string;
  titulo: string;
  ordem: number;
  recursos: RecursoPermissaoView[];
}

@Component({
  selector: 'app-perfil-dialog',
  standalone: true,
  templateUrl: './perfil-dialog.component.html',
  styleUrls: ['./perfil-dialog.component.scss'],
  imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        InputTextoRestritoComponent,
        TablerIconsModule
      ]
})
export class PerfilDialogComponent implements OnInit {
    form!: FormGroup;
    modulos: ModuloPermissaoView[] = [];
    permissoesCatalogo: PermissaoCatalogo[] = [];
    avisoProprietario = false;
  
    constructor(
      private fb: NonNullableFormBuilder,
      private dialogRef: MatDialogRef<PerfilDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private toastr: ToastrService
    ) {}
  
    ngOnInit(): void {
      this.permissoesCatalogo = this.normalizarCatalogo(this.data?.permissoesCatalogo || []);
      this.modulos = this.agruparPermissoes(this.permissoesCatalogo);
      this.avisoProprietario = !!this.data?.perfilProprietario;
      const permissoesObj = Object.fromEntries(
        this.permissoesCatalogo.map(permissao => [this.controlName(permissao), !!permissao.selecionada])
      );
    
      this.form = this.fb.group({
        nome: ['', Validators.required],
        descricao: [''],
        permissoes: this.fb.group(permissoesObj)
      });
    
      if (this.data?.perfil) {
        this.form.patchValue({
          nome: this.data.perfil.nome,
          descricao: this.data.perfil.descricao
        });
      }
    } 
  
    salvar(): void {
      if (this.form.invalid) {
        this.toastr.warning('Preencha todos os campos obrigatórios corretamente.', 'Formulário inválido');
        return;
      }
  
      this.dialogRef.close({
        event: 'Save',
        data: this.form.getRawValue()
      });
    }
  
    cancelar(): void {
      this.dialogRef.close();
    }
  
    getPermissaoControl(chave: string): FormControl<boolean> {
      return this.form.get('permissoes.' + chave) as FormControl<boolean>;
    }

    get permissoesGroup(): FormGroup {
      return this.form.get('permissoes') as FormGroup;
    }

    get nomeControl(): FormControl {
      return this.form.get('nome') as FormControl;
    }

    get descricaoControl(): FormControl {
      return this.form.get('descricao') as FormControl;
    }

    get todasSelecionadas(): boolean {
      return this.totalPermissoes > 0 && this.permissoesCatalogo.every(permissao => this.isSelecionada(permissao));
    }

    get algumasSelecionadas(): boolean {
      return !this.todasSelecionadas && this.permissoesCatalogo.some(permissao => this.isSelecionada(permissao));
    }

    get totalPermissoes(): number {
      return this.permissoesCatalogo.length;
    }

    selecionarTodos(checked: boolean): void {
      this.setPermissoes(this.permissoesCatalogo, checked);
    }

    controlName(permissao: PermissaoCatalogo): string {
      return String(permissao.id);
    }

    labelAcao(permissao: PermissaoCatalogo): string {
      const titulo = (permissao.titulo || '').trim();
      const acao = (permissao.acao || '').trim();
      const recursoTitulo = (permissao.recursoTitulo || '').trim();

      if (titulo && acao && recursoTitulo && !titulo.toUpperCase().includes(acao.toUpperCase())) {
        return titulo;
      }

      return this.formatarAcao(acao || permissao.chave);
    }

    descricaoAcao(permissao: PermissaoCatalogo): string | null {
      return permissao.descricao || permissao.titulo || null;
    }

    moduloSelecionado(modulo: ModuloPermissaoView): boolean {
      const permissoes = this.permissoesDoModulo(modulo);
      return permissoes.length > 0 && permissoes.every(permissao => this.isSelecionada(permissao));
    }

    moduloParcial(modulo: ModuloPermissaoView): boolean {
      const permissoes = this.permissoesDoModulo(modulo);
      return permissoes.some(permissao => this.isSelecionada(permissao)) && !this.moduloSelecionado(modulo);
    }

    selecionarModulo(modulo: ModuloPermissaoView, checked: boolean): void {
      this.setPermissoes(this.permissoesDoModulo(modulo), checked);
    }

    recursoSelecionado(recurso: RecursoPermissaoView): boolean {
      return recurso.permissoes.length > 0 && recurso.permissoes.every(permissao => this.isSelecionada(permissao));
    }

    recursoParcial(recurso: RecursoPermissaoView): boolean {
      return recurso.permissoes.some(permissao => this.isSelecionada(permissao)) && !this.recursoSelecionado(recurso);
    }

    selecionarRecurso(recurso: RecursoPermissaoView, checked: boolean): void {
      this.setPermissoes(recurso.permissoes, checked);
    }

    private normalizarCatalogo(permissoes: PermissaoCatalogo[]): PermissaoCatalogo[] {
      const perfilChaves = new Set<string>((this.data?.perfil?.permissoes || []).map((p: any) => p?.chave).filter(Boolean));
      const perfilIds = new Set<number>((this.data?.perfil?.permissoes || []).map((p: any) => p?.id).filter((id: any) => typeof id === 'number'));

      return permissoes
        .filter(permissao => typeof permissao?.id === 'number' && !!permissao.chave)
        .map(permissao => ({
          ...permissao,
          selecionada: !!permissao.selecionada || perfilIds.has(permissao.id) || perfilChaves.has(permissao.chave)
        }));
    }

    private agruparPermissoes(permissoes: PermissaoCatalogo[]): ModuloPermissaoView[] {
      const modulos = new Map<string, ModuloPermissaoView>();

      for (const permissao of permissoes) {
        const moduloCodigo = permissao.modulo?.codigo || 'GERAL';
        const moduloTitulo = permissao.modulo?.titulo || 'Geral';
        const moduloOrdem = permissao.modulo?.ordem ?? 9999;
        const recursoCodigo = permissao.recurso || 'GERAL';
        const recursoTitulo = permissao.recursoTitulo || this.formatarAcao(recursoCodigo);

        if (!modulos.has(moduloCodigo)) {
          modulos.set(moduloCodigo, {
            codigo: moduloCodigo,
            titulo: moduloTitulo,
            ordem: moduloOrdem,
            recursos: []
          });
        }

        const modulo = modulos.get(moduloCodigo)!;
        let recurso = modulo.recursos.find(item => item.codigo === recursoCodigo);
        if (!recurso) {
          recurso = { codigo: recursoCodigo, titulo: recursoTitulo, permissoes: [] };
          modulo.recursos.push(recurso);
        }
        recurso.permissoes.push(permissao);
      }

      return Array.from(modulos.values())
        .map(modulo => ({
          ...modulo,
          recursos: modulo.recursos
            .map(recurso => ({
              ...recurso,
              permissoes: recurso.permissoes.sort((a, b) => (a.ordem ?? 9999) - (b.ordem ?? 9999) || a.titulo.localeCompare(b.titulo))
            }))
            .sort((a, b) => a.titulo.localeCompare(b.titulo))
        }))
        .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));
    }

    private formatarAcao(valor: string): string {
      const conhecidas: Record<string, string> = {
        VER: 'Visualizar',
        CADASTRAR: 'Cadastrar',
        CRIAR: 'Criar',
        EDITAR: 'Editar',
        EXCLUIR: 'Excluir',
        EXECUTAR: 'Executar',
        CONFIGURAR: 'Configurar',
        GERENCIAR: 'Gerenciar',
        AFASTAR: 'Afastar',
        DESLIGAR: 'Desligar',
        ENVIAR: 'Enviar',
        ENVIAR_GLOBAL: 'Enviar global'
      };

      const chave = (valor || '').toUpperCase();
      if (conhecidas[chave]) {
        return conhecidas[chave];
      }

      return chave
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(' ');
    }

    private permissoesDoModulo(modulo: ModuloPermissaoView): PermissaoCatalogo[] {
      return modulo.recursos.flatMap(recurso => recurso.permissoes);
    }

    private isSelecionada(permissao: PermissaoCatalogo): boolean {
      return !!this.permissoesGroup?.get(this.controlName(permissao))?.value;
    }

    private setPermissoes(permissoes: PermissaoCatalogo[], checked: boolean): void {
      permissoes.forEach(permissao => {
        this.permissoesGroup.get(this.controlName(permissao))?.setValue(checked);
      });
    }
  }
