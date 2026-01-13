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
      passos: [
        'Cadastre nome, e-mail, telefone e documento. Endereço é opcional.',
        'Use a busca para selecionar o cliente no pedido; é obrigatório para fechar o pedido.',
      ],
    },
    {
      id: 'billing',
      titulo: 'Assinatura e pagamentos',
      descricao: 'Resumo da assinatura e histórico de cobranças.',
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
      passos: [
        'Dados da empresa e seleção de cores, formatos, materiais, serviços e acabamentos padrão.',
        'Pode ser reaberto em Conta > Preferências (proprietário) ou no primeiro acesso se não ignorado.',
      ],
    },
    {
      id: 'conta',
      titulo: 'Conta e permissões',
      descricao: 'Perfil, senha e controle de acesso.',
      passos: [
        'Altere nome, telefone, foto e senha em Conta.',
        'Proprietário controla perfis e permissões; onboarding aparece apenas para proprietário com flag ativa.',
      ],
    },
    {
      id: 'faq',
      titulo: 'Dúvidas rápidas',
      descricao: 'Respostas rápidas para mensagens comuns.',
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
