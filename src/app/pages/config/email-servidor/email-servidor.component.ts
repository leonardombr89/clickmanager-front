import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { EmailServidorConfig, EmailServidorService } from './email-servidor.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-email-servidor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    CardHeaderComponent,
    InputTextoRestritoComponent,
    InputEmailComponent,
    InputNumericoComponent
  ],
  templateUrl: './email-servidor.component.html',
  styleUrls: ['./email-servidor.component.scss']
})
export class EmailServidorComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private emailService: EmailServidorService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      host: ['', Validators.required],
      porta: [587, [Validators.required, Validators.min(1)]],
      usuario: ['', Validators.required],
      senha: ['', Validators.required],
      remetente: ['', [Validators.required, Validators.email]],
      usarSsl: [true]
    });
    this.carregar();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.value as EmailServidorConfig;
    this.emailService.atualizar(payload).subscribe({
      next: () => this.toastr.success('Configuração de e-mail salva'),
      error: () => this.toastr.error('Erro ao salvar configuração de e-mail'),
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboards/dashboard1']);
  }

  get hostControl() {
    return this.form.get('host') as FormControl;
  }

  get portaControl() {
    return this.form.get('porta') as FormControl;
  }

  get usuarioControl() {
    return this.form.get('usuario') as FormControl;
  }

  get senhaControl() {
    return this.form.get('senha') as FormControl;
  }

  get remetenteControl() {
    return this.form.get('remetente') as FormControl;
  }

  private carregar(): void {
    this.emailService.obter().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.form.patchValue(cfg);
        }
      },
      error: () => this.toastr.error('Não foi possível carregar configuração de e-mail'),
    });
  }
}
