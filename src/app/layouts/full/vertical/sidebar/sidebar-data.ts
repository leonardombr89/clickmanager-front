import { NavItem } from './nav-item/nav-item';
import { TipoEmpresa } from 'src/app/models/empresa/tipo-empresa.enum';

export const navItems: NavItem[] = [
    {
        navCap: 'Menu'
    },
    {
        displayName: 'Dashboard',
        iconName: 'layout-dashboard',
        bgcolor: 'primary',
        route: '/dashboards/dashboard1',
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'SmartCalc',
        iconName: 'calculator',
        bgcolor: 'primary',
        route: '/smartcalc',
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Gerenciar Pedidos',
        iconName: 'file-text',
        bgcolor: 'primary',
        route: '/page/pedido',
        requiredPermission: ['PEDIDOS_VER', 'PEDIDOS_CADASTRAR'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Configuração SmartCalc',
        iconName: 'calculator',
        bgcolor: 'primary',
        route: '/page/calculadora/config/criar',
        requiredPermission: ['CONFIG_CALCULADORAS'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Usuários',
        iconName: 'user-circle',
        bgcolor: 'primary',
        route: '/page/usuarios/listar',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Gestão de Pessoas',
        iconName: 'briefcase',
        bgcolor: 'primary',
        route: '/page/funcionarios',
        requiredPermission: ['FUNCIONARIO_VER', 'FOLHA_VER'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
        children: [
            {
                displayName: 'Funcionários',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/funcionarios',
                requiredPermission: ['FUNCIONARIO_VER'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Folha de Pagamento',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/folha-pagamento',
                requiredPermission: ['FOLHA_VER'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            }
        ]
    },
    {
        displayName: 'Perfis e Permissões',
        iconName: 'users-group',
        bgcolor: 'primary',
        route: '/page/perfil',
        requiredPermission: ['PERFIS_PERMISSOES_VER', 'PERFIS_PERMISSOES_CADASTRAR', 'PERFIS_PERMISSOES_EDITAR', 'PERFIS_PERMISSOES_EXCLUIR'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Gerenciar Produtos',
        iconName: 'settings',
        bgcolor: 'primary',
        route: '/cadastro-tecnico',
        requiredPermission: [
            'PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR',
            'SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR'
        ],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
        children: [
            {
                displayName: 'Acabamentos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/acabamentos',
                requiredPermission: ['PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Cores',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/cores',
                requiredPermission: ['PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Formatos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/formatos',
                requiredPermission: ['PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Materiais',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/materiais',
                requiredPermission: ['PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Serviços',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/servico',
                requiredPermission: ['SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Produtos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/produtos',
                requiredPermission: ['PRODUTOS_VER', 'PRODUTOS_CADASTRAR', 'PRODUTOS_EDITAR', 'PRODUTOS_EXCLUIR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            }
        ]
    },
    {
        displayName: 'Dashboard',
        iconName: 'layout-dashboard',
        bgcolor: 'primary',
        route: '/page/deposito',
        requiredPermission: ['DEPOSITO_DASHBOARD_VER'],
        allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Gerenciar Orçamentos',
        iconName: 'file-text',
        bgcolor: 'primary',
        route: '/page/deposito/orcamentos',
        requiredPermission: ['DEPOSITO_ORCAMENTOS_VER'],
        allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Usuários',
        iconName: 'user-circle',
        bgcolor: 'primary',
        route: '/page/usuarios/listar',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR'],
        allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Perfis e Permissões',
        iconName: 'users-group',
        bgcolor: 'primary',
        route: '/page/perfil',
        requiredPermission: ['PERFIS_PERMISSOES_VER', 'PERFIS_PERMISSOES_CADASTRAR', 'PERFIS_PERMISSOES_EDITAR', 'PERFIS_PERMISSOES_EXCLUIR'],
        allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Gerenciar Clientes',
        iconName: 'users',
        bgcolor: 'primary',
        route: '/page/cliente',
        requiredPermission: ['CLIENTE_VER', 'CLIENTE_CADASTRAR', 'CLIENTE_EDITAR', 'CLIENTE_EXCLUIR'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
    {
        displayName: 'Gerenciar Produtos',
        iconName: 'settings',
        bgcolor: 'primary',
        route: '/page/deposito/itens',
        requiredPermission: [
            'DEPOSITO_ITENS_VER',
            'DEPOSITO_CATEGORIAS_VER',
            'DEPOSITO_MARCAS_VER'
        ],
        allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
        children: [
            {
                displayName: 'Itens',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/deposito/itens',
                requiredPermission: ['DEPOSITO_ITENS_VER'],
                allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
            },
            {
                displayName: 'Categorias',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/deposito/categorias',
                requiredPermission: ['DEPOSITO_CATEGORIAS_VER'],
                allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
            },
            {
                displayName: 'Marcas',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/deposito/marcas',
                requiredPermission: ['DEPOSITO_MARCAS_VER'],
                allowedEmpresaTipos: [TipoEmpresa.DEPOSITO],
            },
        ]
    },
    {
	        displayName: 'Meu Site',
	        iconName: 'world',
	        bgcolor: 'primary',
	        requiredPermission: ['SITE_BANNERS_VER', 'SITE_PAGINAS_VER', 'SITE_CONFIG_VER', 'STORAGE_DASHBOARD_VER', 'STORAGE_ARQUIVOS_VER', 'STORAGE_LIXEIRA_VER', 'STORAGE_VIDEOS_VER'],
	        allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
	        children: [
            {
                displayName: 'Banners',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/site/banners',
                requiredPermission: ['SITE_BANNERS_VER'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
            },
            {
                displayName: 'Páginas',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/site/paginas',
                requiredPermission: ['SITE_PAGINAS_VER'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
            },
            {
                displayName: 'Configurações',
                iconName: 'point',
                bgcolor: 'transparent',
	                route: '/page/site/configuracoes',
	                requiredPermission: ['SITE_CONFIG_VER'],
	                allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
	            },
	            {
	                displayName: 'Armazenamento',
	                iconName: 'point',
	                bgcolor: 'transparent',
	                route: '/page/site/armazenamento',
	                requiredPermission: ['STORAGE_DASHBOARD_VER', 'STORAGE_ARQUIVOS_VER', 'STORAGE_LIXEIRA_VER', 'STORAGE_VIDEOS_VER'],
	                allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
	            }
	        ]
	    },
    {
        displayName: 'Dados da empresa',
        iconName: 'building',
        bgcolor: 'primary',
        route: '/page/empresa',
        requiredPermission: ['DADOS_EMPRESA'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Configurações',
        iconName: 'settings-automation',
        bgcolor: 'primary',
        route: '/config',
        requiredPermission: ['CONFIG_EMAIL', 'FOLHA_CONFIGURAR'],
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
        children: [
            {
                displayName: 'Servidor de E-mail',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/config/email-servidor',
                requiredPermission: ['CONFIG_EMAIL'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            },
            {
                displayName: 'Folha (Gestão de Pessoas)',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/config/folha-pagamento',
                requiredPermission: ['FOLHA_CONFIGURAR'],
                allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
            }
        ]
    },
    {
        navCap: 'Ajuda',
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Suporte',
        iconName: 'lifebuoy',
        bgcolor: 'primary',
        route: '/page/suporte',
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA, TipoEmpresa.DEPOSITO],
    },
    {
        displayName: 'Central de ajuda',
        iconName: 'help',
        bgcolor: 'primary',
        route: '/page/ajuda',
        allowedEmpresaTipos: [TipoEmpresa.GRAFICA],
    },
];
