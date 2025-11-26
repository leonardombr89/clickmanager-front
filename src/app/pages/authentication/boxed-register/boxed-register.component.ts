import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-boxed-register',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-register.component.html',
})
export class AppBoxedRegisterComponent implements OnInit{

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.authService.verificarSeTemUsuarios().subscribe({
      next: (temUsuario) => {
        if (temUsuario) {
          this.router.navigate(['/authentication/error']);
        }
      }, error: () => {
        this.toastr.error('Erro ao verificar usuários')
        this.router.navigate(['authentication/login']);
      }
    });
  }

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    const { uname, email, password } = this.form.value;

    this.authService.register(email!, password!, uname!).subscribe({
      next: () => {
        this.toastr.success('Usuário registrado com sucesso!');
        this.router.navigate(['authentication/login']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro desconhecido';
        this.toastr.error('Erro ao registrar: ' + msg);
      }
    });
  }
}

