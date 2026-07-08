export enum TipoEmpresa {
  GRAFICA = 'GRAFICA',
  DEPOSITO = 'DEPOSITO',
}

export function resolveTipoEmpresa(tipoEmpresa?: string | null): TipoEmpresa {
  return tipoEmpresa === TipoEmpresa.DEPOSITO ? TipoEmpresa.DEPOSITO : TipoEmpresa.GRAFICA;
}
