import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FeatureFlagService } from '../services/feature-flag.service';

export const featureModuleGuard: CanActivateFn = (route) => {
  const featureService = inject(FeatureFlagService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const featureKey = route.data?.['featureKey'] as string | undefined;

  if (!featureKey || featureService.isEnabled(featureKey)) {
    return true;
  }

  toastr.info('Este módulo não está ativo no seu plano atual.');
  return router.createUrlTree(['/billing/pagamento'], {
    queryParams: { modulo: featureKey }
  });
};

