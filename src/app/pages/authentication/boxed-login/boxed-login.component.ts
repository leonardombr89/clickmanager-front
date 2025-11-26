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
})
export class AppBoxedLoginComponent {
  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
    lembrar: new FormControl(false)
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    const { uname, password, lembrar } = this.form.value;
  
    this.authService.login(uname!, password!, lembrar!).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.toastr.error('Usuário ou senha inválidos');
      }
    });
  }
  
}
