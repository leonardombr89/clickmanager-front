import { TipoEmpresa } from '../models/empresa/tipo-empresa.enum';

export const GRAFICA_ROUTE_DATA = {
  allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
} as const;

export const DEPOSITO_ROUTE_DATA = {
  allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
} as const;

export const SHARED_ROUTE_DATA = {
  allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
} as const;
