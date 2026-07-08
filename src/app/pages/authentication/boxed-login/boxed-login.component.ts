import { Component } from '@angular/core';
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
  selector: 'app-boxed-login',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-login.component.html',
  styleUrls: ['./boxed-login.component.scss'],
})
export class AppBoxedLoginComponent {
  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    lembrar: new FormControl(false)
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    const { uname, password, lembrar } = this.form.value;
  
    this.authService.login(uname!, password!, lembrar!).subscribe({
      next: (usuario) => {
        this.router.navigateByUrl(this.authService.getDefaultRouteForUsuario(usuario));
      },
      error: (error) => {
        if (error?.status === 402) {
          return;
        }

        this.toastr.error('E-mail ou senha inválidos');
      }
    });
  }

  abrirCriacaoConta(): void {
    this.authService.clearSession();
    this.router.navigateByUrl('/onboarding-v2');
  }
  
}
