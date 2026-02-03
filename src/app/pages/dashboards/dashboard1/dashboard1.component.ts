import { Component, OnInit, OnDestroy } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

// components
import { AppCongratulateCardComponent } from '../../../components/dashboard1/congratulate-card/congratulate-card.component';
import { AppLatestDealsComponent } from '../../../components/dashboard1/latest-deals/latest-deals.component';
import { AppCustomersComponent } from '../../../components/dashboard1/customers/customers.component';
import { AppTopProjectsComponent } from '../../../components/dashboard1/top-projects/top-projects.component';
import { AppVisitUsaComponent } from '../../../components/dashboard1/visit-usa/visit-usa.component';
import { AppLatestReviewsComponent } from '../../../components/dashboard1/latest-reviews/latest-reviews.component';
import { AppReceitaResumoComponent } from "src/app/components/dashboard1/receita-resumo/receita-resumo.component";
import { OnboardingWizardComponent } from 'src/app/components/onboarding/onboarding-wizard.component';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';

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
    AppReceitaResumoComponent,
    OnboardingWizardComponent
  ],
  templateUrl: './dashboard1.component.html',
})
export class AppDashboard1Component implements OnInit, OnDestroy {
  private onboardingChecado = false;
  private usuarioSub?: Subscription;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioSub = this.authService.usuario$.subscribe(usuario => {
      this.verificarOnboarding(usuario);
    });
  }

  ngOnDestroy(): void {
    this.usuarioSub?.unsubscribe();
  }

  private verificarOnboarding(usuario: Usuario | null): void {
    if (this.onboardingChecado || !usuario) return;

    if (!usuario.proprietario) {
      this.onboardingChecado = true;
      return;
    }

    const ignorarOnboarding = usuario.onboardingIgnorado ?? usuario.empresa?.onboardingIgnorado;
    if (ignorarOnboarding) {
      this.onboardingChecado = true;
      return;
    }

    this.onboardingChecado = true;
    const nomeEmpresa = usuario.empresa?.nome || 'Sua empresa';
    const naoMostrarMaisDefault = usuario.onboardingIgnorado ?? usuario.empresa?.onboardingIgnorado ?? false;
    this.abrirOnboarding(nomeEmpresa, naoMostrarMaisDefault);
  }

  private abrirOnboarding(empresaNome: string, naoMostrarMaisDefault: boolean): void {
    this.dialog.open(OnboardingWizardComponent, {
      width: '96vw',
      maxWidth: '96vw',
      maxHeight: '92vh',
      disableClose: true,
      data: {
        empresaNome,
        naoMostrarMaisDefault
      },
    });
  }
}
