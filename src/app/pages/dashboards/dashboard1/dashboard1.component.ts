import { Component } from '@angular/core';
import { AppCongratulateCardComponent } from '../../../components/dashboard1/congratulate-card/congratulate-card.component';
import { AppReceitaResumoComponent } from 'src/app/components/dashboard1/receita-resumo/receita-resumo.component';

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [
    AppCongratulateCardComponent,
    AppReceitaResumoComponent
  ],
  templateUrl: './dashboard1.component.html',
})
export class AppDashboard1Component {}
