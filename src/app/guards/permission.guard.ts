import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const required = route.data?.['requiredPermission'] as string[] | string | undefined;
  const requiredList = Array.isArray(required) ? required : required ? [required] : [];

  if (!requiredList.length) return true;

  const hasPermission = requiredList.some((p) => auth.temPermissao(p));
  if (hasPermission) return true;

  toastr.warning('Você não possui permissão para acessar esta configuração.');
  const fallback = auth.getDefaultRouteForUsuario();

  if (state.url !== fallback) {
    return router.createUrlTree([fallback]);
  }

  if (auth.temPermissao('DEPOSITO_ITENS_VER')) {
    return router.createUrlTree(['/page/deposito/itens']);
  }

  if (auth.temPermissao('DADOS_EMPRESA')) {
    return router.createUrlTree(['/page/empresa']);
  }

  return router.createUrlTree(['/dashboards/dashboard1']);
};
