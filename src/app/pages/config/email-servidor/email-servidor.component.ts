import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { EmailServidorConfig, EmailServidorService, EmailServidorTesteRequest } from './email-servidor.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { EmailServidorTesteDialogComponent } from './email-servidor-teste-dialog.component';
import { AuthService } from 'src/app/services/auth.service';

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
  private emailUsuario?: string;
  private mensagemPadraoTeste = 'E-mail de teste do servidor de e-mail do ClickManager. Se você recebeu esta mensagem, sua configuração está funcionando.';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private emailService: EmailServidorService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      host: ['', Validators.required],
      porta: [587, [Validators.required, Validators.min(1)]],
      usuario: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],
      remetente: ['', [Validators.required, Validators.email]],
      usarSsl: [true]
    });
    this.carregar();
    this.authService.usuario$.subscribe(usuario => {
      this.emailUsuario = usuario?.email || undefined;
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.value as EmailServidorConfig;
    this.emailService.atualizar(payload).subscribe({
      next: () => this.toastr.success('Configuração de e-mail salva'),
      error: (err) => this.exibirErro(err, 'Erro ao salvar configuração de e-mail'),
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboards/dashboard1']);
  }

  testar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Preencha a configuração antes de testar.');
      return;
    }

    const dialogRef = this.dialog.open(EmailServidorTesteDialogComponent, {
      width: '600px',
      data: {
        emailDestino: this.emailUsuario ?? '',
        mensagemPadrao: this.mensagemPadraoTeste
      }
    });

    dialogRef.afterClosed().subscribe((result: EmailServidorTesteRequest | undefined) => {
      if (!result) return;
      this.dispararTeste(result);
    });
  }

  private dispararTeste(payload: EmailServidorTesteRequest): void {
    this.emailService.testarEnvio(payload).subscribe({
      next: () => {
        this.toastr.success(`E-mail de teste enviado. Verifique a caixa de entrada de ${payload.emailDestino}.`);
      },
      error: (err) => this.exibirErro(err, 'Não foi possível enviar o e-mail de teste.')
    });
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
      error: (err) => this.exibirErro(err, 'Não foi possível carregar configuração de e-mail'),
    });
  }

  private exibirErro(err: any, fallback: string): void {
    const mensagem = err?.userMessage || fallback;
    this.toastr.error(mensagem);
  }
}
