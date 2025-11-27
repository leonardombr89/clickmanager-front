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
        displayName: 'Calculadora Config',
        iconName: 'calculator',
        bgcolor: 'primary',
        route: '/page/calculadora/config/criar',
        requiredPermission: ['CONFIG_CALCULADORAS']
    },
    {
        displayName: 'Usuários',
        iconName: 'user-circle',
        bgcolor: 'primary',
        route: '/menu-level',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR'],
        children: [
            {
                displayName: 'Lista de Usuários',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/usuarios/listar',
                requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR']
            },
            {
                displayName: 'Novo Usuário',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/usuarios/novo',
                requiredPermission: ['USUARIO_CADASTRAR']
            },
            {
                displayName: 'Perfis e Permissões',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/perfil',
                requiredPermission: ['PERFIS_PERMISSOES_VER', 'PERFIS_PERMISSOES_CADASTRAR', 'PERFIS_PERMISSOES_EDITAR', 'PERFIS_PERMISSOES_EXCLUIR'],
            }
        ],
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
        route: '/clientes',
        requiredPermission: ['CLIENTE_VER', 'CLIENTE_CADASTRAR', 'CLIENTE_EDITAR', 'CLIENTE_EXCLUIR'],
        children: [
            {
                displayName: 'Lista de Clientes',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/cliente',
                requiredPermission: ['CLIENTE_VER']
            },
            {
                displayName: 'Novo Cliente',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/cliente/criar',
                requiredPermission: ['CLIENTE_CADASTRAR']
            }
        ]
    },
    {
        displayName: 'Dados da empresa',
        iconName: 'building',
        bgcolor: 'primary',
        route: '/page/empresa',
        requiredPermission: ['DADOS_EMPRESA']
    },
];
