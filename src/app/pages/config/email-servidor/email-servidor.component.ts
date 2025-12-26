import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';

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

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      host: ['', Validators.required],
      porta: [587, [Validators.required, Validators.min(1)]],
      usuario: ['', Validators.required],
      senha: ['', Validators.required],
      remetente: ['', [Validators.required, Validators.email]],
      usarSsl: [true]
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: Integrar com API de configurações de e-mail
    console.log('Configuração de e-mail salva', this.form.value);
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
}
