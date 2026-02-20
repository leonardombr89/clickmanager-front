import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

type AjudaSecao = {
  id: string;
  titulo: string;
  descricao: string;
  icon?: string;
  passos?: string[];
  itens?: { titulo: string; detalhes: string[] }[];
};

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatExpansionModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './ajuda.component.html',
  styleUrls: ['./ajuda.component.scss'],
})
export class AjudaComponent implements OnInit, OnDestroy {
  filtro = '';
  expandedId: string | null = null;
  private fragSub?: Subscription;
  secoes: AjudaSecao[] = [
    {
      id: 'smartcalc',
      titulo: 'SmartCalc (cálculo de preços)',
      descricao: 'Como configurar e usar o SmartCalc para montar itens no pedido.',
      icon: 'calculate',
      passos: [
        'Cadastre o produto e as variações (material, formato, cor) com o tipo de preço: fixo (peça), metro (m²), quantidade/faixas ou demanda.',
        'No pedido, clique em “Adicionar produto”, selecione produto e variação; o SmartCalc mostra serviços/acabamentos compatíveis.',
        'Preencha quantidade e, se for preço por metro, largura/altura; o cálculo traz valor unitário e subtotal automaticamente.',
        'Marque serviços e acabamentos opcionais (laminação, corte, instalação); eles entram junto com o item base.',
        'Confirme para adicionar ao pedido já com total calculado. Para algo fora do catálogo, use “Descrever itens” (descrição, quantidade e valor unitário).',
        'Se o valor parecer incorreto, confirme se a variação (material/formato/cor) e os campos exigidos pelo tipo de preço estão preenchidos.',
      ],
    },
    {
      id: 'pedidos',
      titulo: 'Cadastro de Produtos (variações e preços)',
      descricao: 'Como o sistema organiza produtos e variações para o SmartCalc.',
      icon: 'inventory_2',
      passos: [
        'Produto = modelo base. Variação = combinação de material, formato e cor com um tipo de preço. Cada variação define como o SmartCalc calcula (fixo por peça, m², faixa de quantidade ou demanda).',
        'No cadastro do produto, crie uma ou mais variações. Exemplo: “Adesivo Vinil” com material Vinil, formato A4, cor Brilho e preço por m². Outra variação pode ser A3, ou cor Fosco, etc.',
        'Associe serviços e acabamentos disponíveis para cada variação (ex.: laminação, corte, instalação). Isso habilita opcionais na montagem do item.',
      ],
    },
    {
      id: 'fluxo-pedido',
      titulo: 'Montar Pedido/Orçamento',
      descricao: 'Como usar o catálogo e o SmartCalc dentro do pedido.',
      icon: 'assignment',
      passos: [
        'Selecione o cliente (ou crie um novo) antes de adicionar itens.',
        'Clique em “Adicionar produto”, escolha produto e variação; SmartCalc mostra preço e opcionais compatíveis.',
        'Preencha quantidade e, se for preço por metro, largura/altura. Revise valor unitário/subtotal e marque serviços/acabamentos desejados.',
        'Adicione ao pedido; repita para mais itens. Para algo fora do catálogo, use “Descrever itens” (descrição, quantidade, valor unitário).',
        'Finalize como orçamento ou pedido. Em orçamento, aprove quando o cliente confirmar; em pedido, registre pagamentos e imprima (1 via, 2 vias, etiqueta, WhatsApp).',
      ],
    },
    {
      id: 'catalogo',
      titulo: 'Catálogo técnico',
      descricao: 'Produtos, variações, serviços e acabamentos.',
      icon: 'category',
      itens: [
        {
          titulo: 'Produtos e variações',
          detalhes: [
            'Defina materiais, formatos e cores; cada combinação vira uma variação com preço.',
            'Suporte a preços: fixo, por metro, por quantidade/faixa ou por demanda.',
          ],
        },
        {
          titulo: 'Serviços e acabamentos',
          detalhes: [
            'Cadastre serviços adicionais e acabamentos padrão.',
            'Vincule serviços/acabamentos às variações para que apareçam no SmartCalc.',
          ],
        },
      ],
    },
    {
      id: 'clientes',
      titulo: 'Clientes',
      descricao: 'Cadastro e uso de clientes nos pedidos.',
      icon: 'groups',
      passos: [
        'Cadastre nome, e-mail, telefone e documento. Endereço é opcional.',
        'Use a busca para selecionar o cliente no pedido; é obrigatório para fechar o pedido.',
      ],
    },
    {
      id: 'funcionarios',
      titulo: 'Funcionários (cadastro e gestão)',
      descricao: 'Manual completo para cadastrar, editar e controlar o ciclo de vida do funcionário.',
      icon: 'badge',
      itens: [
        {
          titulo: '1) Permissões necessárias',
          detalhes: [
            'FUNCIONARIO_VER: ver lista e detalhe.',
            'FUNCIONARIO_CRIAR: criar funcionário e readmitir funcionário desligado.',
            'FUNCIONARIO_EDITAR: editar dados de funcionário ativo/afastado.',
            'FUNCIONARIO_AFASTAR: afastar e retornar funcionário afastado.',
            'FUNCIONARIO_DESLIGAR: desligar funcionário ativo ou afastado.',
          ],
        },
        {
          titulo: '2) Estados possíveis',
          detalhes: [
            'ATIVO: funcionário em atividade normal.',
            'AFASTADO: funcionário temporariamente afastado.',
            'DESLIGADO: vínculo encerrado; dados ficam em histórico.',
          ],
        },
        {
          titulo: '3) Como cadastrar um novo funcionário',
          detalhes: [
            'Vá em Funcionários > Novo funcionário.',
            'Preencha dados pessoais: nome, CPF, telefone e e-mail.',
            'Preencha vínculo: cargo, setor, data de admissão, tipo de contrato, salário e valor da passagem.',
            'Preencha endereço no bloco de endereço.',
            'Clique em Salvar. O funcionário entra na listagem e pode ser detalhado.',
          ],
        },
        {
          titulo: '4) Como funciona o tipo de contrato',
          detalhes: [
            'Opções disponíveis: CLT, PJ, Estágio, Temporário e Sem registro.',
            '“Sem registro” pode ser usado para colaboradores sem vínculo formal no momento.',
          ],
        },
        {
          titulo: '5) Fluxo de status e ações disponíveis',
          detalhes: [
            'Se ATIVO: ações disponíveis são Afastar e Desligar.',
            'Se AFASTADO: ações disponíveis são Retornar ao trabalho e Desligar.',
            'Se DESLIGADO: ação disponível é Readmitir.',
            'Botão Editar não aparece para DESLIGADO.',
          ],
        },
        {
          titulo: '6) Regras de transição (o que pode e o que não pode)',
          detalhes: [
            'Permitido: ATIVO -> AFASTADO.',
            'Permitido: AFASTADO -> ATIVO (retorno ao trabalho).',
            'Permitido: ATIVO -> DESLIGADO.',
            'Permitido: AFASTADO -> DESLIGADO.',
            'Permitido: DESLIGADO -> ATIVO (readmissão).',
            'Transições fora dessas regras são bloqueadas.',
          ],
        },
        {
          titulo: '7) Afastar, desligar, retornar e readmitir (passo a passo)',
          detalhes: [
            'Ao clicar em uma ação de status, o sistema abre modal com motivo e data efetiva.',
            'Motivo é obrigatório para registrar contexto da movimentação.',
            'Data efetiva é obrigatória em afastamento, retorno e desligamento; na readmissão pode ser opcional.',
            'Após confirmar, a tela recarrega automaticamente com status e histórico atualizados.',
          ],
        },
        {
          titulo: '8) Histórico do funcionário (o que fica salvo)',
          detalhes: [
            'Movimentações: mostra eventos como admissão, alterações, afastamentos e desligamentos.',
            'Histórico salarial: exibe vigência, valor e motivo de alterações.',
            'Histórico de passagem: exibe vigência, valor e motivo de alterações.',
            'Snapshots: mostram cargo, setor, status, contrato, salário e passagem no momento de cada movimentação.',
          ],
        },
        {
          titulo: '9) Quando não é possível editar',
          detalhes: [
            'Funcionário DESLIGADO não pode ter dados editados.',
            'Se tentar acessar URL de edição diretamente, o sistema redireciona para a tela de detalhe com aviso.',
            'Para voltar a editar, faça primeiro a Readmissão.',
          ],
        },
        {
          titulo: '10) Boas práticas para uso no dia a dia',
          detalhes: [
            'Use motivos claros e curtos nas mudanças de status (ex.: “Afastamento INSS”, “Retorno após licença”).',
            'Mantenha salário e passagem atualizados para histórico confiável.',
            'Evite desligar antes de registrar a data efetiva correta.',
            'Use Readmissão em vez de criar cadastro duplicado para a mesma pessoa.',
          ],
        },
      ],
    },
    {
      id: 'billing',
      titulo: 'Assinatura e pagamentos',
      descricao: 'Resumo da assinatura e histórico de cobranças.',
      icon: 'payments',
      passos: [
        'Tela “Minha assinatura”: status, periodicidade, valor e próxima cobrança.',
        'Pagamentos listados com status; link para boleto/fatura aparece apenas quando pendente.',
        'Planos: botão “Escolher plano” aparece se estiver em trial.',
      ],
    },
    {
      id: 'onboarding',
      titulo: 'Onboarding da empresa',
      descricao: 'Configuração inicial guiada.',
      icon: 'rocket_launch',
      passos: [
        'Dados da empresa e seleção de cores, formatos, materiais, serviços e acabamentos padrão.',
        'Pode ser reaberto em Conta > Preferências (proprietário) ou no primeiro acesso se não ignorado.',
      ],
    },
    {
      id: 'conta',
      titulo: 'Conta e permissões',
      descricao: 'Perfil, senha e controle de acesso.',
      icon: 'manage_accounts',
      passos: [
        'Altere nome, telefone, foto e senha em Conta.',
        'Proprietário controla perfis e permissões; onboarding aparece apenas para proprietário com flag ativa.',
      ],
    },
    {
      id: 'faq',
      titulo: 'Dúvidas rápidas',
      descricao: 'Respostas rápidas para mensagens comuns.',
      icon: 'help_outline',
      itens: [
        {
          titulo: 'Erro ao adicionar item (produtoVariacaoId obrigatório)',
          detalhes: ['Selecione uma variação no SmartCalc; itens base precisam de produtoVariacaoId.'],
        },
        {
          titulo: 'Link de pagamento não aparece',
          detalhes: ['O botão “Abrir” só aparece quando o status do pagamento é PENDENTE.'],
        },
        {
          titulo: 'Onboarding abre sempre',
          detalhes: ['Marque “Não mostrar mais” ao concluir ou ajuste a flag onboardingIgnorado (proprietário).'],
        },
      ],
    },
    {
      id: 'status-pedido',
      titulo: 'Fluxo do Pedido e Status (do início ao fim)',
      descricao: 'Entenda as diferenças entre Pedido e Orçamento, mudanças permitidas e o que cada status libera ou bloqueia.',
      icon: 'sync_alt',
      itens: [
        {
          titulo: 'Visão geral do fluxo',
          detalhes: [
            'Pedido: RASCUNHO → PENDENTE → AGUARDANDO_PAGAMENTO → EM_PRODUCAO → PRONTO → ENTREGUE (ou CANCELADO).',
            'Orçamento: ORCAMENTO → AGUARDANDO_PAGAMENTO → EM_PRODUCAO → PRONTO → ENTREGUE (ou CANCELADO).',
            'Rascunho nasce do SmartCalc. Pendente nasce de um pedido criado manualmente. Orçamento nasce só se você marcar “Salvar como orçamento”.',
          ],
        },
        {
          titulo: 'Pedido x Orçamento (diferenças)',
          detalhes: [
            'Pedido (PENDENTE): criado manualmente; já vale como pedido em aberto.',
            'Rascunho: gerado pelo SmartCalc; revise cliente/itens e confirme para seguir.',
            'Orçamento: documento pré-pedido; só existe se marcado na criação. Não vira orçamento depois.',
            'Orçamento anda só para frente; pode ser cancelado a qualquer momento.',
          ],
        },
        {
          titulo: 'O que cada status permite',
          detalhes: [
            'RASCUNHO/PENDENTE/ORCAMENTO: editar cliente, itens, observações; lançar pagamentos; trocar status.',
            'AGUARDANDO_PAGAMENTO: editar cliente/itens/observações; lançar pagamentos; iniciar produção.',
            'EM_PRODUCAO: consultar, registrar pagamento; não voltar para fases anteriores.',
            'PRONTO: só leitura para dados/itens; pagamentos ainda permitidos.',
            'ENTREGUE: consulta e pagamentos; sem edição de dados/itens.',
            'CANCELADO: somente leitura de tudo.',
          ],
        },
        {
          titulo: 'Mudanças de status permitidas',
          detalhes: [
            'Pedido: RASCUNHO → PENDENTE; PENDENTE → AGUARDANDO_PAGAMENTO → EM_PRODUCAO → PRONTO → ENTREGUE.',
            'Orçamento: ORCAMENTO → AGUARDANDO_PAGAMENTO → EM_PRODUCAO → PRONTO → ENTREGUE.',
            'A qualquer momento: cancelar (vai para CANCELADO).',
          ],
        },
        {
          titulo: 'Mudanças bloqueadas',
          detalhes: [
            'Não é permitido mudar pedido para ORCAMENTO depois de criado.',
            'Não é permitido voltar fases: ex.: PRONTO → EM_PRODUCAO ou AGUARDANDO_PAGAMENTO → PENDENTE.',
            'Orçamento não volta para RASCUNHO ou PENDENTE.',
          ],
        },
        {
          titulo: 'Exemplos rápidos',
          detalhes: [
            'Pedido manual: nasce PENDENTE → confirma pagamento parcial → vai para EM_PRODUCAO → PRONTO → ENTREGUE.',
            'Orçamento: marque “Salvar como orçamento”; o documento nasce em ORCAMENTO → cliente aprova → segue AGUARDANDO_PAGAMENTO → EM_PRODUCAO → PRONTO → ENTREGUE.',
          ],
        },
      ],
    },
  ];

  get filteredSecoes(): AjudaSecao[] {
    const term = (this.filtro || '').toLowerCase().trim();
    if (!term) return this.secoes;
    return this.secoes.filter(secao => {
      const textoBase = `${secao.titulo} ${secao.descricao}`.toLowerCase();
      const passos = (secao.passos || []).join(' ').toLowerCase();
      const itens = (secao.itens || [])
        .map(i => `${i.titulo} ${i.detalhes.join(' ')}`)
        .join(' ')
        .toLowerCase();
      return [textoBase, passos, itens].some(txt => txt.includes(term));
    });
  }

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.fragSub = this.route.fragment.subscribe(frag => {
      if (frag) {
        this.expandedId = frag;
        setTimeout(() => this.rolarPara(frag), 50);
      }
    });
  }

  ngOnDestroy(): void {
    this.fragSub?.unsubscribe();
  }

  rolarPara(id: string): void {
    const el = document.getElementById(id);
    this.expandedId = id;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
