import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
    {
        navCap: 'Menu'
    },
    {
        displayName: 'Dashboard',
        iconName: 'layout-dashboard',
        bgcolor: 'primary',
        route: '/dashboards/dashboard1',
    },
    {
        displayName: 'Gerenciar Pedidos',
        iconName: 'file-text',
        bgcolor: 'primary',
        route: '/page/pedido',
        requiredPermission: ['PEDIDOS_VER', 'PEDIDOS_CADASTRAR']
    },
    {
        displayName: 'Configuração SmartCalc',
        iconName: 'calculator',
        bgcolor: 'primary',
        route: '/page/calculadora/config/criar',
        requiredPermission: ['CONFIG_CALCULADORAS']
    },
    {
        displayName: 'Usuários',
        iconName: 'user-circle',
        bgcolor: 'primary',
        route: '/page/usuarios/listar',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR']
    },
    {
        displayName: 'Perfis e Permissões',
        iconName: 'users-group',
        bgcolor: 'primary',
        route: '/page/perfil',
        requiredPermission: ['PERFIS_PERMISSOES_VER', 'PERFIS_PERMISSOES_CADASTRAR', 'PERFIS_PERMISSOES_EDITAR', 'PERFIS_PERMISSOES_EXCLUIR'],
    },
    {
        displayName: 'Gerenciar Produtos',
        iconName: 'settings',
        bgcolor: 'primary',
        route: '/cadastro-tecnico',
        requiredPermission: [
            'GERENCIAR_PRODUTOS', 'SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR'
        ],
        children: [
            {
                displayName: 'Acabamentos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/acabamentos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Cores',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/cores',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Formatos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/formatos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Materiais',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/materiais',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Serviços',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/servico',
                requiredPermission: ['SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR']
            },
            {
                displayName: 'Produtos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/produtos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            }
        ]
    },
    {
        displayName: 'Gerenciar Clientes',
        iconName: 'users',
        bgcolor: 'primary',
        route: '/page/cliente',
        requiredPermission: ['CLIENTE_VER', 'CLIENTE_CADASTRAR', 'CLIENTE_EDITAR', 'CLIENTE_EXCLUIR']
    },
    {
        displayName: 'Dados da empresa',
        iconName: 'building',
        bgcolor: 'primary',
        route: '/page/empresa',
        requiredPermission: ['DADOS_EMPRESA']
    },
    {
        displayName: 'Configurações',
        iconName: 'settings-automation',
        bgcolor: 'primary',
        route: '/config',
        requiredPermission: ['CONFIG_EMAIL'],
        children: [
            {
                displayName: 'Servidor de E-mail',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/config/email-servidor',
                requiredPermission: ['CONFIG_EMAIL']
            }
        ]
    },
    {
        navCap: 'Ajuda',
    },
    {
        displayName: 'Central de ajuda',
        iconName: 'help',
        bgcolor: 'primary',
        route: '/page/ajuda',
    },
];
