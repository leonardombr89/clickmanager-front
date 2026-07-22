import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TipoEmpresa } from '../models/empresa/tipo-empresa.enum';
import { Usuario } from '../models/usuario/usuario.model';

export interface EmpresaAppLink {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
  requiredPermission?: string;
}

export interface EmpresaQuicklink {
  id: number;
  title: string;
  link: string;
  abrirNovaAba: boolean;
}

export interface EmpresaLinksConfig {
  depositoCalculadoraRevestimentoAtiva: boolean;
  quicklinks: EmpresaQuicklink[];
}

@Injectable({ providedIn: 'root' })
export class EmpresaLinksService {
  private readonly storagePrefix = 'empresa_links_config';
  private readonly changedSubject = new BehaviorSubject<void>(undefined);
  readonly changed$ = this.changedSubject.asObservable();

  getApps(usuario: Usuario | null | undefined, tipoEmpresa: TipoEmpresa, contexto: 'desktop' | 'mobile'): EmpresaAppLink[] {
    if (tipoEmpresa === TipoEmpresa.DEPOSITO) {
      const config = this.getConfig(usuario, tipoEmpresa);
      return config.depositoCalculadoraRevestimentoAtiva
        ? [
            {
              id: 1,
              img: 'assets/images/svgs/icon-connect.svg',
              title: 'Calculadora de revestimento',
              subtitle: 'Caixas, perda e ambientes',
              link: '/apps/calculadoras/pisos',
              requiredPermission: 'CALCULADORA_PISOS_USAR',
            },
          ]
        : [];
    }

    const graficaApps: EmpresaAppLink[] = [
      {
        id: 1,
        img: 'assets/images/svgs/icon-connect.svg',
        title: 'SmartCalc',
        subtitle: 'Calculadora Inteligente',
        link: '/smartcalc',
      },
    ];

    return contexto === 'mobile'
      ? [
          ...graficaApps,
          {
            id: 2,
            img: 'assets/images/svgs/icon-dd-invoice.svg',
            title: 'Depósito',
            subtitle: 'Catálogo interno',
            link: '/page/deposito/itens',
          },
        ]
      : graficaApps;
  }

  getQuicklinks(usuario: Usuario | null | undefined, tipoEmpresa: TipoEmpresa): EmpresaQuicklink[] {
    if (tipoEmpresa === TipoEmpresa.DEPOSITO) {
      return this.getConfig(usuario, tipoEmpresa).quicklinks;
    }

    return [
      {
        id: 1,
        title: 'Zap Grafica',
        link: 'https://zapgrafica.com.br/home',
        abrirNovaAba: true,
      },
    ];
  }

  getConfig(usuario: Usuario | null | undefined, tipoEmpresa: TipoEmpresa): EmpresaLinksConfig {
    const defaults = this.defaultConfig(tipoEmpresa);
    const raw = localStorage.getItem(this.storageKey(usuario, tipoEmpresa));

    if (!raw) {
      return defaults;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<EmpresaLinksConfig>;
      return {
        depositoCalculadoraRevestimentoAtiva: parsed.depositoCalculadoraRevestimentoAtiva ?? defaults.depositoCalculadoraRevestimentoAtiva,
        quicklinks: Array.isArray(parsed.quicklinks)
          ? parsed.quicklinks.map((quicklink, index) => ({
              id: quicklink.id ?? index + 1,
              title: quicklink.title,
              link: quicklink.link,
              abrirNovaAba: quicklink.abrirNovaAba ?? true,
            }))
          : defaults.quicklinks,
      };
    } catch {
      return defaults;
    }
  }

  saveConfig(usuario: Usuario | null | undefined, tipoEmpresa: TipoEmpresa, config: EmpresaLinksConfig): void {
    localStorage.setItem(this.storageKey(usuario, tipoEmpresa), JSON.stringify(config));
    this.changedSubject.next();
  }

  private defaultConfig(tipoEmpresa: TipoEmpresa): EmpresaLinksConfig {
    return {
      depositoCalculadoraRevestimentoAtiva: tipoEmpresa === TipoEmpresa.DEPOSITO,
      quicklinks: [],
    };
  }

  private storageKey(usuario: Usuario | null | undefined, tipoEmpresa: TipoEmpresa): string {
    return `${this.storagePrefix}_${usuario?.empresa?.id ?? tipoEmpresa}`;
  }
}
