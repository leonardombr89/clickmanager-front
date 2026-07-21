import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { CatalogoCategoriaOption, CatalogoCategoriaRequest } from '../shared/models/catalogo.models';
import { CatalogoCategoriaService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage, catalogoSlugify } from '../shared/utils/catalogo-utils';
import { CanDeactivateWithPendingChanges } from '../shared/guards/pending-changes.guard';

@Component({
  selector: 'app-catalogo-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card [titulo]="isEdit ? 'Editar categoria' : 'Nova categoria'" subtitulo="Cadastro administrativo do novo catalogo">
      <form [formGroup]="form" (ngSubmit)="salvar()">
        <app-section-card titulo="Identificacao" subtitulo="Codigo, nome, slug e hierarquia">
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo" maxlength="50" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" maxlength="120" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Slug</mat-label><input matInput formControlName="slug" maxlength="160" required (input)="slugManual = true" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Categoria pai</mat-label><mat-select formControlName="categoriaPaiId"><mat-option [value]="null">Sem categoria pai</mat-option><mat-option *ngFor="let item of categoriasPaiDisponiveis" [value]="item.id">{{ item.nome }}</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ordem de exibicao</mat-label><input matInput type="number" min="0" formControlName="ordemExibicao" /></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="w-100"><mat-label>Descricao curta</mat-label><textarea matInput rows="2" maxlength="500" formControlName="descricaoCurta"></textarea></mat-form-field>
          <mat-form-field appearance="outline" class="w-100"><mat-label>Descricao completa</mat-label><textarea matInput rows="5" formControlName="descricaoCompleta"></textarea></mat-form-field>
          <div class="toggles"><mat-slide-toggle formControlName="destaque">Destaque</mat-slide-toggle><mat-slide-toggle formControlName="ativo">Ativo</mat-slide-toggle></div>
        </app-section-card>
        <div class="actions">
          <button mat-stroked-button type="button" (click)="voltar()">Voltar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </app-page-card>
  `,
  styles: [`.grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; } .toggles,.actions { display:flex; gap:16px; justify-content:flex-end; margin-top:16px; } @media(max-width:768px){.grid{grid-template-columns:1fr}.actions{justify-content:stretch; flex-direction:column}}`],
})
export class CatalogoCategoriaFormComponent implements OnInit, CanDeactivateWithPendingChanges {
  form = this.fb.group({
    codigo: ['', Validators.required],
    nome: ['', Validators.required],
    slug: ['', Validators.required],
    descricaoCurta: ['', Validators.maxLength(500)],
    descricaoCompleta: [''],
    categoriaPaiId: [null as number | null],
    ordemExibicao: [0, Validators.min(0)],
    destaque: [false],
    ativo: [true],
  });
  categoriasPai: CatalogoCategoriaOption[] = [];
  isEdit = false;
  categoriaId?: number;
  salvando = false;
  salvo = false;
  slugManual = false;

  constructor(private readonly fb: FormBuilder, private readonly service: CatalogoCategoriaService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toastr: ToastrService) {}

  ngOnInit(): void {
    this.service.options(null).subscribe({ next: (items) => (this.categoriasPai = items || []) });
    this.form.controls.nome.valueChanges.subscribe((nome) => {
      if (!this.slugManual) this.form.controls.slug.setValue(catalogoSlugify(nome || ''), { emitEvent: false });
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isEdit = true;
      this.categoriaId = id;
      this.service.detalhar(id).subscribe({
        next: (item) => {
          this.form.patchValue(item);
          this.form.markAsPristine();
        },
        error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Categoria nao encontrada.')),
      });
    }
  }

  get categoriasPaiDisponiveis(): CatalogoCategoriaOption[] {
    return this.categoriasPai.filter((item) => item.id !== this.categoriaId);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const payload = this.form.getRawValue() as CatalogoCategoriaRequest;
    const request$ = this.isEdit && this.categoriaId ? this.service.atualizar(this.categoriaId, payload) : this.service.criar(payload);
    request$.subscribe({
      next: (item) => {
        this.salvando = false;
        this.salvo = true;
        this.form.markAsPristine();
        this.toastr.success(this.isEdit ? 'Categoria atualizada.' : 'Categoria criada.');
        if (!this.isEdit) this.router.navigate(['/page/catalogo/categorias', item.id, 'editar']);
      },
      error: (error) => {
        this.salvando = false;
        this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel salvar a categoria.'));
      },
    });
  }

  voltar(): void { this.router.navigate(['/page/catalogo/categorias']); }
  hasPendingChanges(): boolean { return !this.salvo && this.form.dirty && !this.salvando; }
}
