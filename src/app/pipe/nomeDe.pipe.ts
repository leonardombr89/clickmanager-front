import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nomeDe',
  standalone: true,
})
export class NomeDePipe implements PipeTransform {
  transform(id: any, lista: { id: any; nome: string }[] = []): string {
    return lista.find(item => item.id === id)?.nome ?? '---';
  }
}