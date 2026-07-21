import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateWithPendingChanges {
  hasPendingChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<CanDeactivateWithPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) {
    return true;
  }

  return window.confirm('Existem alteracoes nao salvas. Deseja sair mesmo assim?');
};
