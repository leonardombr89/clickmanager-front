import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DepositoImagemUploadComponent } from 'src/app/pages/deposito/components/deposito-imagem-upload/deposito-imagem-upload.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { CatalogoMarcaRequest } from '../shared/models/catalogo.models';
import { CatalogoMarcaService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage, catalogoSlugify } from '../shared/utils/catalogo-utils';
import { CanDeactivateWithPendingChanges } from '../shared/guards/pending-changes.guard';

@Component({
  selector: 'app-catalogo-marca-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent, DepositoImagemUploadComponent],
  template: `
    <app-page-card [titulo]="isEdit ? 'Editar marca' : 'Nova marca'" subtitulo="Cadastro administrativo de marcas do catalogo">
      <form [formGroup]="form" (ngSubmit)="salvar()">
        <app-section-card titulo="Dados da marca" subtitulo="Identificacao, imagem e exibicao">
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo" maxlength="50" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" maxlength="120" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Slug</mat-label><input matInput formControlName="slug" maxlength="160" required (input)="slugManual = true" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ordem de exibicao</mat-label><input matInput type="number" min="0" formControlName="ordemExibicao" /></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="w-100"><mat-label>Descricao</mat-label><textarea matInput rows="4" formControlName="descricao"></textarea></mat-form-field>
          <app-deposito-imagem-upload context="marcas" label="Imagem da marca" [imagemAtual]="imagemAtual" (imagemSelecionada)="onImagemSelecionada($event)" (uploadingChange)="uploading = $event"></app-deposito-imagem-upload>
          <div class="toggles"><mat-slide-toggle formControlName="destaque">Destaque</mat-slide-toggle><mat-slide-toggle formControlName="ativo">Ativo</mat-slide-toggle></div>
        </app-section-card>
        <div class="actions"><button mat-stroked-button type="button" (click)="voltar()">Voltar</button><button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando || uploading">{{ salvando ? 'Salvando...' : 'Salvar' }}</button></div>
      </form>
    </app-page-card>
  `,
  styles: [`.grid{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px}.toggles,.actions{display:flex; gap:16px; justify-content:flex-end; margin-top:16px}@media(max-width:900px){.grid{grid-template-columns:1fr}.actions{flex-direction:column}}`],
})
export class CatalogoMarcaFormComponent implements OnInit, CanDeactivateWithPendingChanges {
  form = this.fb.group({ codigo: ['', Validators.required], nome: ['', Validators.required], slug: ['', Validators.required], descricao: [''], imagemArquivoId: [null as number | null], ordemExibicao: [0, Validators.min(0)], destaque: [false], ativo: [true] });
  isEdit = false;
  marcaId?: number;
  salvando = false;
  uploading = false;
  salvo = false;
  slugManual = false;
  imagemAtual: any = null;

  constructor(private readonly fb: FormBuilder, private readonly service: CatalogoMarcaService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toastr: ToastrService) {}

  ngOnInit(): void {
    this.form.controls.nome.valueChanges.subscribe((nome) => { if (!this.slugManual) this.form.controls.slug.setValue(catalogoSlugify(nome || ''), { emitEvent: false }); });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.isEdit = true;
      this.marcaId = id;
      this.service.detalhar(id).subscribe({
        next: (item) => {
          this.imagemAtual = item.imagem;
          this.form.patchValue({ ...item, imagemArquivoId: item.imagem?.arquivoId ?? null });
          this.form.markAsPristine();
        },
        error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Marca nao encontrada.')),
      });
    }
  }

  onImagemSelecionada(imagem: any): void {
    this.imagemAtual = imagem;
    this.form.controls.imagemArquivoId.setValue(imagem ? (imagem.arquivoId ?? imagem.id ?? null) : null);
    this.form.markAsDirty();
  }

  salvar(): void {
    if (this.form.invalid || this.uploading) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const payload = this.form.getRawValue() as CatalogoMarcaRequest;
    const request$ = this.isEdit && this.marcaId ? this.service.atualizar(this.marcaId, payload) : this.service.criar(payload);
    request$.subscribe({
      next: (item) => {
        this.salvando = false;
        this.salvo = true;
        this.form.markAsPristine();
        this.toastr.success(this.isEdit ? 'Marca atualizada.' : 'Marca criada.');
        if (!this.isEdit) this.router.navigate(['/page/catalogo/marcas', item.id, 'editar']);
      },
      error: (error) => { this.salvando = false; this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel salvar a marca.')); },
    });
  }

  voltar(): void { this.router.navigate(['/page/catalogo/marcas']); }
  hasPendingChanges(): boolean { return !this.salvo && this.form.dirty && !this.salvando; }
}
