export interface PermissaoDefinicao {
  chave: string;
  titulo: string;
  grupo: string;
}

export const DEFINICOES: PermissaoDefinicao[] = [
  { chave: 'DADOS_EMPRESA', titulo: 'Gerenciar dados da empresa', grupo: 'Empresa' },

  // 👤 Usuários
  { chave: 'USUARIOS_VER', titulo: 'Visualizar usuários', grupo: 'Usuários' },
  { chave: 'USUARIO_CADASTRAR', titulo: 'Cadastrar usuário', grupo: 'Usuários' },
  { chave: 'USUARIO_EDITAR', titulo: 'Editar usuário', grupo: 'Usuários' },
  { chave: 'USUARIO_EXCLUIR', titulo: 'Excluir usuário', grupo: 'Usuários' },

  // 🛡 Perfis e Permissões
  { chave: 'PERFIS_PERMISSOES_VER', titulo: 'Visualizar perfis e permissões', grupo: 'Perfis e Permissões' },
  { chave: 'PERFIS_PERMISSOES_CADASTRAR', titulo: 'Cadastrar perfil de acesso', grupo: 'Perfis e Permissões' },
  { chave: 'PERFIS_PERMISSOES_EDITAR', titulo: 'Editar perfil de acesso', grupo: 'Perfis e Permissões' },
  { chave: 'PERFIS_PERMISSOES_EXCLUIR', titulo: 'Excluir perfil de acesso', grupo: 'Perfis e Permissões' },

  // 🛠 Serviços
  { chave: 'SERVICOS_VER', titulo: 'Visualizar serviços', grupo: 'Serviços' },
  { chave: 'SERVICOS_CADASTRAR', titulo: 'Cadastrar serviço', grupo: 'Serviços' },
  { chave: 'SERVICOS_EDITAR', titulo: 'Editar serviço', grupo: 'Serviços' },
  { chave: 'SERVICOS_EXCLUIR', titulo: 'Excluir serviço', grupo: 'Serviços' },

  // 📦 Produtos
  { chave: 'PRODUTOS_VER', titulo: 'Visualizar produtos', grupo: 'Produtos' },
  { chave: 'PRODUTOS_CADASTRAR', titulo: 'Cadastrar produto', grupo: 'Produtos' },
  { chave: 'PRODUTOS_EDITAR', titulo: 'Editar produto', grupo: 'Produtos' },
  { chave: 'PRODUTOS_EXCLUIR', titulo: 'Excluir produto', grupo: 'Produtos' },

  // 📦 Gerenciar Produtos
  { chave: 'GERENCIAR_PRODUTOS', titulo: 'Gerenciar produtos', grupo: 'Gerenciar produtos' },

  // 📄 Pedidos
  { chave: 'PEDIDOS_VER', titulo: 'Visualizar pedidos', grupo: 'Pedidos' },
  { chave: 'PEDIDOS_CADASTRAR', titulo: 'Cadastrar pedido', grupo: 'Pedidos' },
  { chave: 'PEDIDOS_EDITAR', titulo: 'Editar pedido', grupo: 'Pedidos' },
  { chave: 'PEDIDOS_EXCLUIR', titulo: 'Excluir pedido', grupo: 'Pedidos' },

  // 👥 Clientes
  { chave: 'CLIENTE_VER', titulo: 'Visualizar clientes', grupo: 'Clientes' },
  { chave: 'CLIENTE_CADASTRAR', titulo: 'Cadastrar cliente', grupo: 'Clientes' },
  { chave: 'CLIENTE_EDITAR', titulo: 'Editar cliente', grupo: 'Clientes' },
  { chave: 'CLIENTE_EXCLUIR', titulo: 'Excluir cliente', grupo: 'Clientes' },

  // 🧑‍💼 Funcionários
  { chave: 'FUNCIONARIO_VER', titulo: 'Visualizar funcionários (lista e detalhe)', grupo: 'Funcionários' },
  { chave: 'FUNCIONARIO_CRIAR', titulo: 'Cadastrar funcionário', grupo: 'Funcionários' },
  { chave: 'FUNCIONARIO_EDITAR', titulo: 'Editar funcionário', grupo: 'Funcionários' },
  { chave: 'FUNCIONARIO_AFASTAR', titulo: 'Afastar funcionário', grupo: 'Funcionários' },
  { chave: 'FUNCIONARIO_DESLIGAR', titulo: 'Desligar funcionário', grupo: 'Funcionários' },

  // 🧮 Calculadoras
  { chave: 'CONFIG_CALCULADORAS', titulo: 'Configurar calculadoras', grupo: 'Calculadoras' },
  { chave: 'USAR_CALCULADORAS', titulo: 'Utilizar calculadoras', grupo: 'Calculadoras' },

  // ⚙️ Configurações
  { chave: 'CONFIG_EMAIL', titulo: 'Configurar e-mail', grupo: 'Configurações' }

];


export const PERMISSION_GROUPS: Record<string, string[]> = DEFINICOES.reduce((acc, def) => {
  if (!acc[def.grupo]) acc[def.grupo] = [];
  acc[def.grupo].push(def.chave);
  return acc;
}, {} as Record<string, string[]>);

export const PERMISSION_TITLES: Record<string, string> = DEFINICOES.reduce((acc, def) => {
  acc[def.chave] = def.titulo;
  return acc;
}, {} as Record<string, string>);
