export interface PerfilRequest {
  nome: string;
  descricao?: string;
  permissoes: PermissaoSelecaoRequest[];
}

export interface PermissaoSelecaoRequest {
  id: number;
  selecionada: boolean;
}
