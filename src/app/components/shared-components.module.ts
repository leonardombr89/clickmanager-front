import { NgModule } from '@angular/core';
import { InputNumericoComponent } from './inputs/input-numerico/input-numerico.component';
import { InputMoedaComponent } from './inputs/input-moeda/input-moeda.component';
import { InputTextoRestritoComponent } from './inputs/input-texto/input-texto-restrito.component';
import { AutoCompleteComponent } from './inputs/auto-complete/auto-complete.component';

export const SHARED_COMPONENTS = [
  InputNumericoComponent,
  InputMoedaComponent,
  AutoCompleteComponent,
  InputTextoRestritoComponent
];

@NgModule({
  imports: SHARED_COMPONENTS,
  exports: SHARED_COMPONENTS
})
export class SharedComponentsModule {}
