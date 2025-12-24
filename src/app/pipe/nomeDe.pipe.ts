import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'nomeDe', standalone: true })
export class NomeDePipe implements PipeTransform {

  transform(value: any, lista: any[] = [], campo: string = 'nome'): string {
    if (!lista || !lista.length || value == null) return '---';

    const id = typeof value === 'object' && 'id' in value ? value.id : value;

    const item = lista.find(x => x && x.id === id);
    return item ? (item[campo] ?? '---') : '---';
  }
}