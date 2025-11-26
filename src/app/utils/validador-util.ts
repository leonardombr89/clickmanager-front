import { AbstractControl, ValidationErrors } from '@angular/forms';

export class ValidadorUtil {
  static validarCNPJ(control: AbstractControl): ValidationErrors | null {
    const cnpj = control.value?.replace(/\D/g, '');

    if (!cnpj || cnpj.length !== 14) return { cnpjInvalido: true };

    const invalidos = [
      '00000000000000', '11111111111111', '22222222222222', '33333333333333',
      '44444444444444', '55555555555555', '66666666666666', '77777777777777',
      '88888888888888', '99999999999999'
    ];

    if (invalidos.includes(cnpj)) return { cnpjInvalido: true };

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += +numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== +digitos.charAt(0)) return { cnpjInvalido: true };

    tamanho++;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += +numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== +digitos.charAt(1)) return { cnpjInvalido: true };

    return null;
  }
}
