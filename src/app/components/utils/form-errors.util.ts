import { AbstractControl } from '@angular/forms';

export function getErroCampo(control: AbstractControl | null): string | null {
  if (!control || !control.touched || !control.errors) return null;

  if (control.errors['required']) return 'Campo obrigatório';

  if (control.errors['maxlength']) {
    const requiredLength = control.errors['maxlength'].requiredLength;
    return `Máximo de ${requiredLength} caracteres`;
  }

  if (control.errors['minlength']) {
    const requiredLength = control.errors['minlength'].requiredLength;
    return `Mínimo de ${requiredLength} caracteres`;
  }

  if (control.errors['pattern']) return 'Formato inválido';
  if (control.errors['email']) return 'E-mail inválido';

  return 'Valor inválido';
}
