import { Component, OnInit } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// components
import { AppCongratulateCardComponent } from '../../../components/dashboard1/congratulate-card/congratulate-card.component';
import { AppLatestDealsComponent } from '../../../components/dashboard1/latest-deals/latest-deals.component';
import { AppCustomersComponent } from '../../../components/dashboard1/customers/customers.component';
import { AppTopProjectsComponent } from '../../../components/dashboard1/top-projects/top-projects.component';
import { AppVisitUsaComponent } from '../../../components/dashboard1/visit-usa/visit-usa.component';
import { AppLatestReviewsComponent } from '../../../components/dashboard1/latest-reviews/latest-reviews.component';
import { AppReceitaResumoComponent } from "src/app/components/dashboard1/receita-resumo/receita-resumo.component";
import { OnboardingService, OnboardingStatusResponse } from 'src/app/components/onboarding/onboarding.service';
import { OnboardingWizardComponent } from 'src/app/components/onboarding/onboarding-wizard.component';

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [
    TablerIconsModule,
    MatDialogModule,
    AppCongratulateCardComponent,
    AppCustomersComponent,
    AppTopProjectsComponent,
    AppLatestDealsComponent,
    AppVisitUsaComponent,
    AppLatestReviewsComponent,
    AppReceitaResumoComponent
  ],
  templateUrl: './dashboard1.component.html',
})
export class AppDashboard1Component implements OnInit {
  private onboardingChecado = false;

  constructor(
    private onboardingService: OnboardingService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.verificarOnboarding();
  }

  private verificarOnboarding(): void {
    if (this.onboardingChecado) return;

    this.onboardingService.obterStatus().subscribe({
      next: (status: OnboardingStatusResponse) => {
        this.onboardingChecado = true;
        if (!status.onboardingConcluido) {
          this.abrirOnboarding(status);
        }
      },
      error: () => {
        this.onboardingChecado = true;
      }
    });
  }

  private abrirOnboarding(status: OnboardingStatusResponse): void {
    this.dialog.open(OnboardingWizardComponent, {
      width: '96vw',
      maxWidth: '96vw',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        empresaNome: status.empresaNome,
      },
    });
  }
}
