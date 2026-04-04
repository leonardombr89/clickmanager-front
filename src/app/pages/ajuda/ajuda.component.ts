import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatRippleModule } from '@angular/material/core';

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
  imports: [CommonModule, MatCardModule, MatExpansionModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatRippleModule],
  templateUrl: './ajuda.component.html',
  styleUrls: ['./ajuda.component.scss'],
})
export class AjudaComponent implements OnInit, OnDestroy {
  filtro = '';
  expandedId: string | null = null;
  isMobileView = false;
  showAllQuickTopics = false;
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
      id: 'produtos',
      titulo: 'Produtos e catálogo técnico',
      descricao: 'Manual principal para produtos, materiais, formatos, cores, serviços e acabamentos.',
      icon: 'inventory_2',
      itens: [
        {
          titulo: '1) Como pensar o cadastro',
          detalhes: [
            'Produto é o modelo comercial. Variação é a combinação técnica usada no SmartCalc e no pedido.',
            'Cada variação junta material, formato e cor. Depois você adiciona serviços e acabamentos compatíveis.',
            'A ideia é cadastrar uma base reutilizável para o time vender rápido, sem montar preço manual toda vez.',
          ],
        },
        {
          titulo: '2) O que cadastrar antes do produto',
          detalhes: [
            'Materiais: definem a base física do item, como Vinil brilho, Couché 180g ou Lona.',
            'Formatos: definem as dimensões e área útil, como A4, A3, SRA3 ou tamanhos próprios.',
            'Cores: representam o padrão de impressão, como 4x0, 4x4, 1x0.',
            'Serviços: representam cobranças adicionais, como instalação, arte, embalagem ou aplicação.',
            'Acabamentos: representam complementos técnicos, como laminação, verniz, corte especial ou dobra.',
          ],
        },
        {
          titulo: '3) Como criar um produto',
          detalhes: [
            'Etapa 1: preencha nome e descrição. Use um nome claro para o time localizar rápido.',
            'Etapa 2: monte a estrutura escolhendo materiais, formatos e cores. O sistema gera as combinações automaticamente.',
            'Etapa 3: defina o preço base das variações. Você pode aplicar uma regra geral e depois ajustar exceções.',
            'Etapa 4: revise o resumo final e salve.',
          ],
        },
        {
          titulo: '4) Como funcionam as variações',
          detalhes: [
            'Cada variação representa uma combinação vendável, por exemplo: Vinil Brilho • A4 • 4x0.',
            'A variação carrega o tipo de preço e determina como o SmartCalc vai calcular no pedido.',
            'Você pode editar uma variação individualmente sem precisar apagar e recriar todas as outras.',
          ],
        },
        {
          titulo: '5) Tipos de preço e quando usar',
          detalhes: [
            'Preço fixo: use quando cada peça tem um valor fechado.',
            'Preço por metro quadrado: use quando o valor depende de largura x altura.',
            'Preço por quantidade/faixas: use quando o valor muda conforme o volume.',
            'Preço por demanda: use quando a regra depende de intervalos ou cenários específicos do produto.',
          ],
        },
        {
          titulo: '6) Serviços e acabamentos no produto',
          detalhes: [
            'Serviços e acabamentos ficam vinculados às variações para aparecerem como opcionais no SmartCalc.',
            'Use serviços para cobranças operacionais e acabamentos para complementos técnicos do item.',
            'Nem toda variação precisa ter os mesmos extras; ajuste só onde fizer sentido.',
          ],
        },
        {
          titulo: '7) Como editar depois',
          detalhes: [
            'Na edição, revise primeiro as variações já existentes. O foco principal deve ser gerenciar o que já está configurado.',
            'Você pode gerar novas combinações sem perder as atuais, desde que não crie duplicidades.',
            'Também é possível editar preço, serviços e acabamentos de uma variação específica.',
          ],
        },
        {
          titulo: '8) Como isso aparece no pedido',
          detalhes: [
            'No pedido, o usuário escolhe o produto, depois a variação compatível.',
            'O SmartCalc usa a configuração da variação para calcular valor, quantidade e opcionais.',
            'Se o catálogo estiver bem montado, a criação do pedido fica rápida e padronizada.',
          ],
        },
        {
          titulo: '9) Boas práticas',
          detalhes: [
            'Use nomes simples e consistentes em materiais, formatos e cores.',
            'Gere combinações em lote primeiro e ajuste exceções depois.',
            'Evite duplicar produtos quando a diferença for só material, formato, cor ou preço.',
            'Revise sempre as variações antes de salvar para evitar combinações desnecessárias.',
          ],
        },
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
      id: 'acabamentos',
      titulo: 'Acabamentos',
      descricao: 'Como cadastrar um acabamento e montar variações de aplicação e preço de forma simples.',
      icon: 'auto_awesome',
      itens: [
        {
          titulo: '1) O que é um acabamento',
          detalhes: [
            'Acabamento é uma configuração extra aplicada ao produto, como laminação, verniz, corte especial ou dobra.',
            'O cadastro define o nome do acabamento e as regras de preço por material, formato e tipo de aplicação.',
          ],
        },
        {
          titulo: '2) Como cadastrar',
          detalhes: [
            'Preencha primeiro o nome e a descrição do acabamento.',
            'Depois vá para o gerador de variações para montar as combinações de preço.',
          ],
        },
        {
          titulo: '3) Como gerar variações',
          detalhes: [
            'Selecione os materiais, formatos e tipos de aplicação que devem usar a mesma regra.',
            'Defina o preço base e clique em “Gerar variações”.',
            'Se deixar material ou formato em branco, a regra pode valer para todos daquele grupo.',
          ],
        },
        {
          titulo: '4) Como revisar e ajustar',
          detalhes: [
            'As combinações geradas aparecem na lista de variações salvas.',
            'Você pode editar uma linha específica, duplicar com ajustes ou aplicar preço em lote em várias linhas selecionadas.',
            'O sistema evita combinações repetidas para não gerar duplicidade no cadastro.',
          ],
        },
        {
          titulo: '5) Antes de salvar',
          detalhes: [
            'Confira se o acabamento tem nome preenchido.',
            'Verifique se existe pelo menos uma variação pronta.',
            'Use o bloco final de revisão para confirmar que está tudo certo antes de salvar.',
          ],
        },
        {
          titulo: '6) Boas práticas',
          detalhes: [
            'Use nomes fáceis de reconhecer no dia a dia, como “Laminação fosca” ou “Verniz localizado”.',
            'Gere primeiro em lote e ajuste só as exceções depois.',
            'Evite criar muitas variações manuais quando puder montar grupos e deixar o sistema gerar automaticamente.',
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
      id: 'folha-pagamento',
      titulo: 'Folha de pagamento',
      descricao: 'Guia simples para abrir competência, lançar valores, registrar pagamentos e fechar sem erro.',
      icon: 'payments',
      itens: [
        {
          titulo: '1) Visão geral da tela de Folha',
          detalhes: [
            'A competência (ex.: 2026-02) mostra um mês da folha.',
            'Se não existir competência aberta, o sistema cria automaticamente a competência do mês vigente.',
            'No topo você vê contexto, status da competência, pagamento previsto e saldo pendente total.',
            'A tabela lista cada colaborador com bruto, descontos, líquido, pago e pendente.',
          ],
        },
        {
          titulo: '2) Status que você vai ver',
          detalhes: [
            'Competência: ABERTA ou FECHADA.',
            'Folha do colaborador: ABERTO, PARCIAL, PAGO ou FECHADO.',
            'PARCIAL significa que já houve pagamento, mas ainda existe saldo pendente.',
          ],
        },
        {
          titulo: '3) Fluxo recomendado do mês (passo a passo)',
          detalhes: [
            '1. Selecione a competência do mês.',
            '2. Revise os valores dos colaboradores.',
            '3. Faça lançamentos de provento/desconto quando necessário.',
            '4. Registre adiantamentos e empréstimos quando necessário.',
            '5. Registre pagamentos (pode ser parcial).',
            '6. Feche a competência somente quando o pendente total for R$ 0,00.',
          ],
        },
        {
          titulo: '4) Lançamentos (o que altera o valor)',
          detalhes: [
            'Provento: aumenta o líquido (ex.: hora extra, comissão, bônus).',
            'Desconto manual: reduz o líquido (ex.: falta).',
            'Lançamentos só podem ser feitos em folha aberta.',
          ],
        },
        {
          titulo: '5) Adiantamento e empréstimo (diferença)',
          detalhes: [
            'Adiantamento: use o botão “Registrar adiantamento” (fluxo separado do desconto manual).',
            'Empréstimo: use o botão “Novo empréstimo parcelado” para criar parcelamento.',
            'Você pode usar “Renegociar acordos” para reorganizar descontos futuros.',
            'As regras respeitam a configuração da empresa (permissão, limite percentual, parcelas e carência).',
          ],
        },
        {
          titulo: '6) Pagamentos',
          detalhes: [
            'O pagamento padrão é PIX, mas o registro guarda forma e observação.',
            'É possível pagar em partes; o sistema atualiza para PARCIAL automaticamente.',
            'Quando o total pago atingir o líquido, a folha passa para PAGO.',
          ],
        },
        {
          titulo: '7) Fechar e reabrir competência',
          detalhes: [
            'Fechar competência bloqueia novos lançamentos naquele mês.',
            'Se houver pendência, o botão de fechar fica desabilitado e mostra o motivo.',
            'Ao fechar uma competência, o sistema já prepara a próxima automaticamente.',
            'Se necessário, reabra a competência para ajustes (com permissão de edição).',
          ],
        },
        {
          titulo: '8) Comunicação e documento do colaborador',
          detalhes: [
            'No detalhe da folha, use “Resumo WhatsApp” para gerar um texto claro do pagamento.',
            'O texto inclui ganhos, descontos, valor pago, pendente e situação dos acordos.',
            'Use “Gerar contracheque” para CLT e “Gerar comprovante de pagamento” para os demais contratos.',
          ],
        },
        {
          titulo: '9) Exportação',
          detalhes: [
            'Na lista da folha você pode exportar CSV da competência atual.',
            'Também é possível exportar CSV consolidado com todas as competências.',
          ],
        },
        {
          titulo: '10) Configurações que impactam a folha',
          detalhes: [
            'Regra de pagamento padrão: dia fixo ou 5º dia útil.',
            'Política de acordos: permitir adiantamento/empréstimo, limite percentual, máximo de parcelas e carência.',
            'Política de passagem: não aplicar, lançar como provento ou lançar como desconto.',
            'Essas configurações ficam em Configuração da Folha.',
          ],
        },
        {
          titulo: '11) Erros comuns e como evitar',
          detalhes: [
            'Não consegue fechar competência: confira o saldo pendente total e quite os valores.',
            'Não consegue lançar ajuste: verifique se a competência está FECHADA.',
            'Competência não encontrada: volte para a lista de competências e selecione uma válida.',
          ],
        },
      ],
    },
    {
      id: 'folha-configuracao',
      titulo: 'Configuração da folha',
      descricao: 'Defina a regra padrão de pagamento e políticas de acordos e passagem da empresa.',
      icon: 'tune',
      itens: [
        {
          titulo: '1) Para que serve esta tela',
          detalhes: [
            'Esta tela define as regras padrão da folha para toda a empresa.',
            'O que você configurar aqui afeta criação de competências, acordos e cálculo automático de passagem.',
          ],
        },
        {
          titulo: '2) Regra padrão de pagamento',
          detalhes: [
            'QUINTO_DIA_UTIL: o sistema calcula automaticamente a data de pagamento no 5º dia útil.',
            'DIA_FIXO: você escolhe um dia entre 1 e 31 para pagamento mensal.',
            'Essa regra é usada por padrão ao abrir competência, salvo quando houver override manual.',
          ],
        },
        {
          titulo: '3) Política de passagem',
          detalhes: [
            'NAO_APLICAR: passagem não entra no cálculo da folha.',
            'PROVENTO: passagem entra somando no bruto/líquido.',
            'DESCONTO: passagem entra reduzindo o líquido.',
          ],
        },
        {
          titulo: '4) Política de adiantamento e empréstimo',
          detalhes: [
            'Permitir adiantamento: habilita ou bloqueia o botão “Registrar adiantamento”.',
            'Permitir empréstimo: habilita ou bloqueia o botão “Novo empréstimo parcelado”.',
            'Limite percentual do salário: trava acordos acima do percentual definido.',
            'Máximo de parcelas: limita quantas parcelas podem ser escolhidas no empréstimo.',
            'Carência mínima: define a quantidade mínima de competências antes do primeiro desconto.',
          ],
        },
        {
          titulo: '5) Boas práticas',
          detalhes: [
            'Defina a regra de pagamento antes de começar a operar a folha do mês.',
            'Revise limite percentual e máximo de parcelas para evitar descontos excessivos.',
            'Após salvar, valide no detalhe da folha se os valores estão sendo calculados conforme a política.',
          ],
        },
      ],
    },
    {
      id: 'notificacoes',
      titulo: 'Notificações',
      descricao: 'Como visualizar, enviar e acompanhar notificações dentro do sistema.',
      icon: 'notifications',
      itens: [
        {
          titulo: '1) Onde aparecem as notificações',
          detalhes: [
            'No topo do sistema, o sino mostra um resumo rápido com as notificações mais recentes.',
            'Ao clicar em uma notificação no sino, o sistema abre Meu Perfil > aba Notificações com o detalhe já selecionado.',
            'Na aba Notificações você consegue ver a lista completa, o detalhe e o status de leitura.',
          ],
        },
        {
          titulo: '2) Quem pode visualizar',
          detalhes: [
            'Todos os usuários autenticados da empresa podem visualizar as notificações recebidas.',
            'A tela mostra apenas notificações destinadas ao usuário logado.',
            'Você pode usar o filtro “Mostrar apenas não lidas” para focar no que ainda precisa ver.',
          ],
        },
        {
          titulo: '3) Como funciona a leitura',
          detalhes: [
            'Quando você abre uma notificação, ela é marcada como lida automaticamente.',
            'No sino e na listagem, itens ainda não lidos aparecem com destaque visual.',
            'O botão “Marcar todas como lidas” limpa rapidamente os avisos pendentes.',
          ],
        },
        {
          titulo: '4) Como enviar uma notificação',
          detalhes: [
            'É necessário ter a permissão “Enviar notificações”.',
            'Na tela de notificações, clique em “Enviar notificação”.',
            'Preencha título, conteúdo, nível e, se quiser, resumo e link relacionado.',
          ],
        },
        {
          titulo: '5) Tipos de destino disponíveis',
          detalhes: [
            'Empresa inteira: envia para todos os usuários ativos da empresa.',
            'Usuários específicos: permite escolher um ou mais destinatários manualmente.',
            'O envio global para todas as empresas não faz parte do uso normal da empresa e fica reservado para módulo administrativo futuro.',
          ],
        },
        {
          titulo: '6) Níveis da notificação',
          detalhes: [
            'Informação: aviso neutro do dia a dia.',
            'Sucesso: confirmações e retornos positivos.',
            'Atenção: algo que exige acompanhamento.',
            'Crítico: situação urgente ou que pode impactar a operação.',
            'Na lista e no detalhe, cada nível usa destaque visual próprio para facilitar a leitura rápida.',
          ],
        },
        {
          titulo: '7) Link relacionado',
          detalhes: [
            'Se a notificação tiver um link, o botão “Abrir link relacionado” aparece no detalhe.',
            'Use esse campo para levar o usuário direto para um pedido, tela ou recurso específico.',
            'Se não houver link, a notificação continua funcionando normalmente apenas como comunicado.',
          ],
        },
        {
          titulo: '8) Boas práticas para enviar',
          detalhes: [
            'Use títulos curtos e claros.',
            'No resumo, destaque a informação principal em uma frase rápida.',
            'No conteúdo, explique a ação esperada ou o contexto da mensagem.',
            'Prefira nível Atenção ou Crítico apenas quando realmente houver urgência.',
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

  get featuredSecao(): AjudaSecao | null {
    const base = this.filteredSecoes;
    if (!base.length) {
      return null;
    }

    const smartcalc = base.find(secao => secao.id === 'smartcalc');
    return smartcalc ?? base[0];
  }

  get remainingSecoes(): AjudaSecao[] {
    const featuredId = this.featuredSecao?.id;
    return this.filteredSecoes.filter(secao => secao.id !== featuredId);
  }

  get quickTopics(): { id: string; label: string; icon: string }[] {
    const topics = [
      { id: 'smartcalc', label: 'SmartCalc', icon: 'calculate' },
      { id: 'produtos', label: 'Produtos', icon: 'inventory_2' },
      { id: 'fluxo-pedido', label: 'Pedidos', icon: 'assignment' },
      { id: 'acabamentos', label: 'Acabamentos', icon: 'auto_awesome' },
      { id: 'notificacoes', label: 'Notificações', icon: 'notifications' },
      { id: 'funcionarios', label: 'Funcionários', icon: 'badge' },
      { id: 'folha-pagamento', label: 'Folha', icon: 'payments' },
      { id: 'folha-configuracao', label: 'Config. Folha', icon: 'tune' },
      { id: 'status-pedido', label: 'Fluxo do pedido', icon: 'sync_alt' },
      { id: 'catalogo', label: 'Catálogo', icon: 'category' },
    ];

    return topics.filter(topic => this.secoes.some(secao => secao.id === topic.id));
  }

  get visibleQuickTopics(): { id: string; label: string; icon: string }[] {
    if (!this.isMobileView || this.showAllQuickTopics) {
      return this.quickTopics;
    }

    return this.quickTopics.slice(0, 6);
  }

  get hasHiddenQuickTopics(): boolean {
    return this.isMobileView && this.quickTopics.length > this.visibleQuickTopics.length;
  }

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.fragSub = this.route.fragment.subscribe(frag => {
      if (frag) {
        this.expandedId = frag;
        setTimeout(() => this.rolarPara(frag), 50);
      }
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  ngOnDestroy(): void {
    this.fragSub?.unsubscribe();
  }

  rolarPara(id: string): void {
    const el = document.getElementById(id);
    this.expandedId = id;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleQuickTopics(): void {
    this.showAllQuickTopics = !this.showAllQuickTopics;
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
  }
}
