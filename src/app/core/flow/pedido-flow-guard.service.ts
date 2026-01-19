import { Injectable } from '@angular/core';
import { FlowConfig, FlowContext, FlowPermissoes, FlowStatus, FlowTransicoes } from './pedido-flow.types';

@Injectable({ providedIn: 'root' })
export class PedidoFlowGuardService {

  getPermissoes(config: FlowConfig | null, statusAtual: string): FlowPermissoes {
    const st = this.lookupStatus(config, statusAtual);
    return st?.permissoes ?? { cliente: true, itens: true, observacoes: true, pagamentos: true, status: true };
  }

  getStatus(config: FlowConfig | null, statusAtual: string): FlowStatus | null {
    return this.lookupStatus(config, statusAtual);
  }

  getTransicoes(config: FlowConfig | null, statusAtual: string, ctx: FlowContext): { status: string; label: string; bloqueado: boolean; motivo?: string; warn?: boolean }[] {
    const st = this.lookupStatus(config, statusAtual);
    if (!st || !config) return [];
    if (st.key.toUpperCase() === 'ORCAMENTO' && st.internoBloqueado?.length && st.internoBloqueado.includes((ctx.orcamentoStatus || '').toUpperCase())) {
      return [];
    }
    const transicoes: FlowTransicoes | undefined = st.transicoes;
    const permitidas = transicoes?.permitidas ?? [];
    return permitidas.map(to => {
      const destino = this.lookupStatus(config, to);
      const valida = this.validateRegras(transicoes, to, ctx);
      return {
        status: to,
        label: destino?.label || to,
        bloqueado: !valida.ok,
        motivo: valida.message,
        warn: valida.warn
      };
    });
  }

  validateTransicao(config: FlowConfig | null, from: string, to: string, ctx: FlowContext): { ok: boolean; message?: string; warn?: boolean } {
    if (!config) return { ok: false, message: 'Fluxo não configurado.' };
    const origem = this.lookupStatus(config, from);
    const destino = this.lookupStatus(config, to);
    if (!origem || !destino) return { ok: true }; // fallback permissivo

    if (origem.key.toUpperCase() === 'ORCAMENTO' && origem.internoBloqueado?.length && origem.internoBloqueado.includes((ctx.orcamentoStatus || '').toUpperCase())) {
      return { ok: false, message: 'Orçamento vencido ou cancelado não permite novas ações.' };
    }

    // apenas avança se restrição ativa
    if (origem.restricoes?.somenteAvanca && (destino.ordem ?? 0) < (origem.ordem ?? 0)) {
      return { ok: false, message: 'Este status só pode avançar.' };
    }
    if (destino.restricoes?.permitirSomenteDe?.length && !destino.restricoes.permitirSomenteDe.includes(from.toUpperCase())) {
      return { ok: false, message: 'Transição não permitida para este destino.' };
    }

    const transicoes = origem.transicoes;
    const permitidas = transicoes?.permitidas ?? [];
    if (!permitidas.includes(to.toUpperCase())) {
      return { ok: false, message: 'Transição não configurada para este status.' };
    }

    const regra = this.validateRegras(transicoes, to, ctx);
    if (!regra.ok) return regra;

    return regra.warn ? { ok: true, warn: true, message: regra.message } : { ok: true };
  }

  private validateRegras(transicoes: FlowTransicoes | undefined, to: string, ctx: FlowContext): { ok: boolean; message?: string; warn?: boolean } {
    if (!transicoes?.regras?.length) return { ok: true };
    const regra = transicoes.regras.find(r => r.to.toUpperCase() === to.toUpperCase());
    if (!regra) return { ok: true };

    const check = (cond: any): boolean => {
      const val = (ctx as any)[cond.field];
      switch (cond.op) {
        case '>': return val > cond.value;
        case '>=': return val >= cond.value;
        case '<': return val < cond.value;
        case '<=': return val <= cond.value;
        case '==': return val == cond.value; // eslint-disable-line eqeqeq
        case '!=': return val != cond.value; // eslint-disable-line eqeqeq
        case 'empty': return !val;
        case 'notEmpty': return !!val;
        default: return true;
      }
    };

    if (regra.all?.length && !regra.all.every(check)) {
      const condFalha = regra.all.find(c => !check(c));
      const warn = regra.warnOnly === true;
      return {
        ok: !warn ? false : true,
        warn,
        message: condFalha?.message || regra.message || 'Condições para avançar não foram atendidas.'
      };
    }
    if (regra.any?.length && !regra.any.some(check)) {
      const condFalha = regra.any[0];
      const warn = regra.warnOnly === true;
      return {
        ok: !warn ? false : true,
        warn,
        message: condFalha?.message || regra.message || 'Condições para avançar não foram atendidas.'
      };
    }
    return { ok: true };
  }

  private lookupStatus(config: FlowConfig | null, status: string): FlowStatus | null {
    if (!config) return null;
    const key = (status || '').toUpperCase();
    return config.status.find(s => s.key.toUpperCase() === key) || null;
  }
}
