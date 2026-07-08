import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { EmpresaFormComponent } from './empresa/empresa-form.component';
import { ListarUsuariosComponent } from './usuarios/listar-usuarios/listar-usuarios.component';
import { FormUsuarioComponent } from './usuarios/form-usuario/form-usuario.component';
import { FormProdutoComponent } from './cadastro-tecnico/produtos/form-produto/form-produto.component';
import { ListarCoresComponent } from './cadastro-tecnico/cores/listar-cores/listar-cores.component';
import { FormCoresComponent } from './cadastro-tecnico/cores/form-cores/form-cores.component';
import { ListarMaterialComponent } from './cadastro-tecnico/materiais/listar-material/listar-material.component';
import { FormMaterialComponent } from './cadastro-tecnico/materiais/form-material/form-material.component';
import { FormAcabamentoComponent } from './cadastro-tecnico/acabamentos/form-acabamento/form-acabamento.component';
import { ListarAcabamentoComponent } from './cadastro-tecnico/acabamentos/listar-acabamento/listar-acabamento.component';
import { FormFormatoComponent } from './cadastro-tecnico/formatos/form-formato/form-formato.component';
import { ListarFormatoComponent } from './cadastro-tecnico/formatos/listar-formato/listar-formato.component';
import { ListarProdutosComponent } from './cadastro-tecnico/produtos/listar-produtos/listar-produtos.component';
import { FormPedidoComponent } from './pedido/form-pedido/form-pedido.component';
import { ListarPedidoComponent } from 'src/app/pages/pedido/listar-pedido/listar-pedido.component';
import { FormClienteComponent } from './cliente/form-cliente/form-cliente.component';
import { ListarClienteComponent } from './cliente/listar-cliente/listar-cliente.component';
import { DetalhesPedidoComponent } from 'src/app/pages/pedido/detalhes-pedido/detalhes-pedido.component';
import { FormServicoComponent } from './cadastro-tecnico/servicos/form-servico/form-servico.component';
import { ListarServicoComponent } from './cadastro-tecnico/servicos/listar-servicos/listar-servicos.component';
import { CalculadoraConfigComponent } from './smart-calc-config/smart-calc-config/smart-calc-config.component';
import { EmailServidorComponent } from './config/email-servidor/email-servidor.component';
import { FolhaConfigComponent } from './config/folha-config/folha-config.component';
import { GerenciarPerfilComponent } from './perfil/gerenciar-perfil/gerenciar-perfil.component';
import { AjudaComponent } from './ajuda/ajuda.component';
import { ListarFuncionariosComponent } from './funcionarios/listar-funcionarios/listar-funcionarios.component';
import { FormFuncionarioComponent } from './funcionarios/form-funcionario/form-funcionario.component';
import { DetalheFuncionarioComponent } from './funcionarios/detalhe-funcionario/detalhe-funcionario.component';
import { ListarFolhaPagamentoComponent } from './pessoas/folha/listar-folha/listar-folha-pagamento.component';
import { DetalheFolhaPagamentoComponent } from './pessoas/folha/detalhe-folha/detalhe-folha-pagamento.component';
import { SuporteComponent } from './suporte/suporte.component';
import { featureModuleGuard } from '../guards/feature-module.guard';
import { permissionGuard } from '../guards/permission.guard';
import { ListarCategoriasDepositoComponent } from './deposito/categorias/listar-categorias-deposito/listar-categorias-deposito.component';
import { FormCategoriaDepositoComponent } from './deposito/categorias/form-categoria-deposito/form-categoria-deposito.component';
import { ListarMarcasDepositoComponent } from './deposito/marcas/listar-marcas-deposito/listar-marcas-deposito.component';
import { FormMarcaDepositoComponent } from './deposito/marcas/form-marca-deposito/form-marca-deposito.component';
import { ListarItensDepositoComponent } from './deposito/itens/listar-itens-deposito/listar-itens-deposito.component';
import { FormItemDepositoComponent } from './deposito/itens/form-item-deposito/form-item-deposito.component';
import { DepositoDashboardPageComponent } from './deposito/dashboard/deposito-dashboard-page.component';
import { DEPOSITO_ROUTE_DATA, GRAFICA_ROUTE_DATA, SHARED_ROUTE_DATA } from '../guards/empresa-tipo-route-data';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter Page',
    },
  },
  {
    path: 'empresa',
    component: EmpresaFormComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Dados da Empresa',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Dados da Empresa' }
      ]
    }
  },
  {
    path: 'perfil',
    component: GerenciarPerfilComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Gerenciamento de perfil dos usuários',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Gerenciamento de perfil dos usuários' }
      ]
    }
  },
  {
    path: 'ajuda',
    component: AjudaComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Central de ajuda',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Ajuda' }
      ]
    }
  },
  {
    path: 'funcionarios',
    component: ListarFuncionariosComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'funcionarios',
      title: 'Gestão de Funcionários',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Funcionários' }
      ]
    }
  },
  {
    path: 'funcionarios/novo',
    component: FormFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'funcionarios',
      title: 'Novo Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Novo Funcionário' }
      ]
    }
  },
  {
    path: 'funcionarios/editar/:id',
    component: FormFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'funcionarios',
      title: 'Editar Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Editar Funcionário' }
      ]
    }
  },
  {
    path: 'funcionarios/detalhe/:id',
    component: DetalheFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'funcionarios',
      title: 'Detalhe do Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Detalhe' }
      ]
    }
  },
  {
    path: 'suporte',
    component: SuporteComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Suporte',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Suporte' }
      ]
    }
  },
  {
    path: 'suporte/:id',
    component: SuporteComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Detalhe do chamado',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Suporte', url: '/page/suporte' },
        { title: 'Detalhe' }
      ]
    }
  },
  {
    path: 'folha-pagamento',
    component: ListarFolhaPagamentoComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'folhaPagamento',
      title: 'Folha de Pagamento',
      urls: [
        { title: 'Gestão de Pessoas', url: '/page/funcionarios' },
        { title: 'Folha de Pagamento' }
      ]
    }
  },
  {
    path: 'folha-pagamento/detalhe/:competencia/:funcionarioId',
    component: DetalheFolhaPagamentoComponent,
    canActivate: [featureModuleGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      featureKey: 'folhaPagamento',
      title: 'Detalhe da Folha',
      urls: [
        { title: 'Folha de Pagamento', url: '/page/folha-pagamento' },
        { title: 'Detalhe da Folha' }
      ]
    }
  },
  {
    path: 'config/folha-pagamento',
    component: FolhaConfigComponent,
    canActivate: [permissionGuard],
    data: {
      ...GRAFICA_ROUTE_DATA,
      requiredPermission: ['FOLHA_CONFIGURAR'],
      title: 'Configuração da Folha',
      urls: [
        { title: 'Configurações', url: '/page/config/email-servidor' },
        { title: 'Configuração da Folha' }
      ]
    }
  },
  {
    path: 'usuarios/novo',
    component: FormUsuarioComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Cadastro de novo usuário',
      urls: [
        { title: 'Novo usuário', url: '/dashboards/dashboard1' },
        { title: 'Cadastro de novo usuário' }
      ]
    }
  },
  {
    path: 'usuarios/editar/:id',
    component: FormUsuarioComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Editar usuário',
      urls: [
        { title: 'Usuários', url: '/usuarios' },
        { title: 'Editar usuário' }
      ]
    }
  },
  {
    path: 'usuarios/listar',
    component: ListarUsuariosComponent,
    data: {
      ...SHARED_ROUTE_DATA,
      title: 'Lista de usuários',
      urls: [
        { title: 'Lista de usuários', url: '/dashboards/dashboard1' },
        { title: 'Lista de usuários' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores',
    component: ListarCoresComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lsita de Cores',
      urls: [
        { title: 'Lsita de Cores', url: '/cadastro-tecnico' },
        { title: 'Cores' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores/nova',
    component: FormCoresComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Nova Cor',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Nova Cor' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores/editar/:id',
    component: FormCoresComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Cor',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Cor' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais',
    component: ListarMaterialComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Materiais',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Materiais' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais/nova',
    component: FormMaterialComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Novo Material',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Material' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais/editar/:id',
    component: FormMaterialComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Material',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Material' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos',
    component: ListarAcabamentoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Acabamentos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Acabamentos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos/criar',
    component: FormAcabamentoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Novo Acabamento',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Acabamento' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos/editar/:id',
    component: FormAcabamentoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Acabamento',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Acabamento' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos',
    component: ListarFormatoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Formatos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Formatos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos/criar',
    component: FormFormatoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Novo Formato',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Formato' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos/editar/:id',
    component: FormFormatoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Formato',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Formato' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos',
    component: ListarProdutosComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Produtos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Produtos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos/criar',
    component: FormProdutoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Criar Produto',
      urls: [
        { title: 'Lista de produtos', url: '/page/cadastro-tecnico/produtos' },
        { title: 'Criar Produto' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos/editar/:id',
    component: FormProdutoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Produto',
      urls: [
        { title: 'Lista de produtos', url: '/page/cadastro-tecnico/produtos' },
        { title: 'Editar Produto' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico',
    component: ListarServicoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Serviços',
      urls: [
        { title: 'Serviços', url: '/servico' },
        { title: 'Lista de Serviços' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico/criar',
    component: FormServicoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Criar Serviço',
      urls: [
        { title: 'Lista de Serviços', url: '/page/cadastro-tecnico/servico' },
        { title: 'Criar Serviço' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico/editar/:id',
    component: FormServicoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Serviço',
      urls: [
        { title: 'Lista de Serviços', url: '/page/cadastro-tecnico/servico' },
        { title: 'Editar Serviço' }
      ]
    }
  },
  {
    path: 'deposito',
    component: DepositoDashboardPageComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Dashboard do Depósito',
      urls: [
        { title: 'Dashboard' }
      ]
    }
  },
  {
    path: 'deposito/categorias',
    component: ListarCategoriasDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Categorias de Depósito',
      urls: [
        { title: 'Depósito', url: '/page/deposito/categorias' },
        { title: 'Categorias' }
      ]
    }
  },
  {
    path: 'deposito/categorias/nova',
    component: FormCategoriaDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Nova Categoria de Depósito',
      urls: [
        { title: 'Categorias de Depósito', url: '/page/deposito/categorias' },
        { title: 'Nova Categoria' }
      ]
    }
  },
  {
    path: 'deposito/categorias/editar/:id',
    component: FormCategoriaDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Editar Categoria de Depósito',
      urls: [
        { title: 'Categorias de Depósito', url: '/page/deposito/categorias' },
        { title: 'Editar Categoria' }
      ]
    }
  },
  {
    path: 'deposito/itens',
    component: ListarItensDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Itens de Depósito',
      urls: [
        { title: 'Depósito', url: '/page/deposito/itens' },
        { title: 'Itens' }
      ]
    }
  },
  {
    path: 'deposito/itens/novo',
    component: FormItemDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Novo Item de Depósito',
      urls: [
        { title: 'Itens de Depósito', url: '/page/deposito/itens' },
        { title: 'Novo Item' }
      ]
    }
  },
  {
    path: 'deposito/itens/editar/:id',
    component: FormItemDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Editar Item de Depósito',
      urls: [
        { title: 'Itens de Depósito', url: '/page/deposito/itens' },
        { title: 'Editar Item' }
      ]
    }
  },
  {
    path: 'deposito/marcas',
    component: ListarMarcasDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Marcas de Depósito',
      urls: [
        { title: 'Depósito', url: '/page/deposito/marcas' },
        { title: 'Marcas' }
      ]
    }
  },
  {
    path: 'deposito/marcas/nova',
    component: FormMarcaDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Nova Marca de Depósito',
      urls: [
        { title: 'Marcas de Depósito', url: '/page/deposito/marcas' },
        { title: 'Nova Marca' }
      ]
    }
  },
  {
    path: 'deposito/marcas/editar/:id',
    component: FormMarcaDepositoComponent,
    data: {
      ...DEPOSITO_ROUTE_DATA,
      title: 'Editar Marca de Depósito',
      urls: [
        { title: 'Marcas de Depósito', url: '/page/deposito/marcas' },
        { title: 'Editar Marca' }
      ]
    }
  },
  {
    path: 'pedido',
    component: ListarPedidoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Pedidos',
      urls: [
        { title: 'Pedidos', url: '/pedido' },
        { title: 'Lista de Pedidos' }
      ]
    }
  },
  {
    path: 'pedido/criar',
    component: FormPedidoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Criar Pedido',
      urls: [
        { title: 'Lista de Pedidos', url: '/page/pedido' },
        { title: 'Criar Pedido' }
      ]
    }
  },
  {
    path: 'pedido/detalhe/:id',
    component: DetalhesPedidoComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Detalhes Pedido',
      urls: [
        { title: 'Detalhes de Pedidos', url: '/page/pedido' },
        { title: 'Detalhes Pedido' }
      ]
    }
  },
  {
    path: 'cliente',
    component: ListarClienteComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Lista de Clientes',
      urls: [
        { title: 'Clientes', url: '/cliente' },
        { title: 'Lista de Clientes' }
      ]
    }
  },
  {
    path: 'cliente/criar',
    component: FormClienteComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Criar Cliente',
      urls: [
        { title: 'Lista de Clientes', url: '/page/cliente' },
        { title: 'Criar Cliente' }
      ]
    }
  },
  {
    path: 'cliente/editar/:id',
    component: FormClienteComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Cliente',
      urls: [
        { title: 'Lista de Clientes', url: '/page/cliente' },
        { title: 'Editar Cliente' }
      ]
    }
  },
  {
    path: 'calculadora/config/criar',
    component: CalculadoraConfigComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Configuração SmartCalc',
      urls: [
        { title: 'Configuração SmartCalc', url: '/page/calculadora/config' },
        { title: 'Configuração SmartCalc' }
      ]
    }
  },
  {
    path: 'calculadora/config/editar/:id',
    component: CalculadoraConfigComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Editar Configuração',
      urls: [
        { title: 'Lista de Configurações', url: '/page/calculadora/config' },
        { title: 'Editar Configuração' }
      ]
    }
  },
  {
    path: 'config/email-servidor',
    component: EmailServidorComponent,
    data: {
      ...GRAFICA_ROUTE_DATA,
      title: 'Servidor de E-mail',
      urls: [
        { title: 'Configurações', url: '/dashboards/dashboard1' },
        { title: 'Servidor de E-mail' }
      ]
    }
  }
];
