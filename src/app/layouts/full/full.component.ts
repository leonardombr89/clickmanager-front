import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { navItems } from './vertical/sidebar/sidebar-data';
import { NavService } from '../../services/nav.service';
import { AppNavItemComponent } from './vertical/sidebar/nav-item/nav-item.component';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './vertical/header/header.component';
import { AppBreadcrumbComponent } from './shared/breadcrumb/breadcrumb.component';
import { CustomizerComponent } from './shared/customizer/customizer.component';
import { AuthService } from 'src/app/services/auth.service';
import { NavItem } from './vertical/sidebar/nav-item/nav-item';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { BrandingComponent } from './vertical/sidebar/branding.component';
import { BillingBannerComponent } from '../../components/billing-banner/billing-banner.component';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { OnboardingFlowService } from 'src/app/components/onboarding/onboarding-flow.service';
import { ImagemUtil } from 'src/app/utils/imagem-util';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';
const MONITOR_VIEW = 'screen and (min-width: 1024px)';
const BELOWMONITOR = 'screen and (max-width: 1023px)';

// for mobile app sidebar
interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

interface MobileNavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-full',
  standalone: true,
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    HeaderComponent,
    AppBreadcrumbComponent,
    CustomizerComponent,
    BrandingComponent,
    BillingBannerComponent
  ],
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit, OnDestroy {

  @ViewChild('leftsidenav')
  public sidenav: MatSidenav;
  resView = false;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  //get options from service
  options = this.settings.getOptions();
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;
  private isContentWidthFixed = true;
  private isCollapsedWidthFixed = false;
  private htmlElement!: HTMLHtmlElement;

  usuarioLogado: Usuario | null = null;
  navItemsFiltrados: NavItem[] = [];
  exibirAvisoOnboarding = false;
  ImagemUtil = ImagemUtil;
  mobileNavGroups: MobileNavGroup[] = [];
  mobileDrawerOpen = false;
  mobileAppsOpen = false;
  mobileProfileOpen = false;
  currentRoute = '';
  currentPageTitle = '';
  private mobileExpandedItems = new Set<string>();

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  get isTablet(): boolean {
    return this.resView;
  }

  get isMobileLayout(): boolean {
    return this.resView;
  }

  get hasMobileOverlayOpen(): boolean {
    return this.mobileDrawerOpen || this.mobileAppsOpen || this.mobileProfileOpen;
  }

  get mobileProfileSubtitle(): string {
    return this.usuarioLogado?.perfil?.nome || this.usuarioLogado?.username || '';
  }

  // for mobile app sidebar
  apps: apps[] = [
    {
      id: 1,
      img: 'assets/images/svgs/icon-connect.svg',
      title: 'SmartCalc',
      subtitle: 'Calculadora Inteligente',
      link: '/apps/smart-calc',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Zap Grafica',
      link: 'https://zapgrafica.com.br/home',
    },
  ];

  constructor(
    private settings: CoreService,
    private mediaMatcher: MediaMatcher,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private navService: NavService,
    private authService: AuthService,
    @Inject(BillingService) private billingService: BillingService,
    private billingState: BillingStateService,
    private onboardingFlow: OnboardingFlowService,
  ) {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW, MONITOR_VIEW, BELOWMONITOR])
      .subscribe((state) => {
        // SidenavOpened must be reset true when layout changes
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
        if (this.options.sidenavCollapsed == false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
        this.isContentWidthFixed = state.breakpoints[MONITOR_VIEW];
        this.resView = state.breakpoints[BELOWMONITOR];

        if (!this.resView) {
          this.closeMobileOverlays();
        }
      });

    // Initialize project theme with options
    this.receiveOptions(this.options);

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
        this.currentRoute = (e as NavigationEnd).urlAfterRedirects;
        this.currentPageTitle = this.resolveCurrentPageTitle(this.currentRoute);
        this.closeMobileOverlays();
      });
  }

  ngOnInit(): void {
    this.authService.usuario$
      .pipe(
        filter((usuario): usuario is Usuario =>
          !!usuario &&
          !!usuario.perfil &&
          Array.isArray(usuario.perfil.permissoes) &&
          usuario.perfil.permissoes.length > 0
        )
      )
      .subscribe(usuario => {  
        this.usuarioLogado = usuario;
        const permissoes = usuario.perfil!.permissoes.map(p => p.chave);
        this.navItemsFiltrados = this.filtrarMenusPorPermissao(navItems, permissoes);
        this.mobileNavGroups = this.buildMobileNavGroups(this.navItemsFiltrados);
        this.currentPageTitle = this.resolveCurrentPageTitle(this.router.url);
        this.carregarStatusBilling();
        this.carregarAvisoOnboarding(usuario);
      });

    this.currentRoute = this.router.url;
    this.currentPageTitle = this.resolveCurrentPageTitle(this.currentRoute);
  }

  ngOnDestroy() {
    this.unlockBodyScroll();
    this.layoutChangesSubscription.unsubscribe();
  }

  filtrarMenusPorPermissao(items: NavItem[], permissoesUsuario: string[]): NavItem[] {  
    const possuiPermissao = (requeridas?: string[]) => {
      const resultado = !requeridas || requeridas.some(p => permissoesUsuario.includes(p));
      if (requeridas && !resultado) {
      }
      return resultado;
    };
  
    const filtrar = (menus: NavItem[]): NavItem[] =>
      menus
        .filter(menu => possuiPermissao(menu.requiredPermission))
        .map(menu => ({
          ...menu,
          children: menu.children ? filtrar(menu.children) : undefined
        }));
  
    return filtrar(items);
  }
  

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.options = options;
    this.toggleDarkTheme(options);
  }

  private carregarStatusBilling(): void {
    this.billingService.obterStatus().subscribe({
      next: (resp) => this.billingState.setFromResponse(resp),
      error: () => {}
    });
  }

  continuarOnboarding(): void {
    this.router.navigate(['/onboarding']);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen = !this.mobileDrawerOpen;
    if (this.mobileDrawerOpen) {
      this.mobileAppsOpen = false;
      this.mobileProfileOpen = false;
    }
    this.syncBodyScroll();
  }

  toggleMobileAppsSheet(): void {
    this.mobileAppsOpen = !this.mobileAppsOpen;
    if (this.mobileAppsOpen) {
      this.mobileDrawerOpen = false;
      this.mobileProfileOpen = false;
    }
    this.syncBodyScroll();
  }

  toggleMobileProfileSheet(): void {
    this.mobileProfileOpen = !this.mobileProfileOpen;
    if (this.mobileProfileOpen) {
      this.mobileDrawerOpen = false;
      this.mobileAppsOpen = false;
    }
    this.syncBodyScroll();
  }

  closeMobileOverlays(): void {
    this.mobileDrawerOpen = false;
    this.mobileAppsOpen = false;
    this.mobileProfileOpen = false;
    this.syncBodyScroll();
  }

  onMobileNavItemClick(item: NavItem): void {
    if (item.children?.length) {
      this.toggleMobileItemExpanded(item);
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onMobileChildItemClick(item: NavItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  toggleMobileItemExpanded(item: NavItem): void {
    const key = this.getMobileItemKey(item);
    if (this.mobileExpandedItems.has(key)) {
      this.mobileExpandedItems.delete(key);
      return;
    }

    this.mobileExpandedItems.add(key);
  }

  isMobileItemExpanded(item: NavItem): boolean {
    return this.mobileExpandedItems.has(this.getMobileItemKey(item));
  }

  isMobileItemActive(item: NavItem): boolean {
    if (item.route && this.router.isActive(item.route, false)) {
      return true;
    }

    return !!item.children?.some((child) => child.route ? this.router.isActive(child.route, false) : false);
  }

  trackByGroupTitle(_: number, group: MobileNavGroup): string {
    return group.title;
  }

  trackByNavItem(_: number, item: NavItem): string {
    return this.getMobileItemKey(item);
  }

  private carregarAvisoOnboarding(usuario: Usuario): void {
    if (!usuario?.proprietario) {
      this.exibirAvisoOnboarding = false;
      return;
    }

    const usuarioId = usuario.id ?? null;
    const ignorarOnboarding = usuario.onboardingIgnorado ?? usuario.empresa?.onboardingIgnorado;
    if (ignorarOnboarding || !usuarioId || !this.onboardingFlow.wasDismissed(usuarioId)) {
      this.exibirAvisoOnboarding = false;
      return;
    }

    this.onboardingFlow.loadStatus(true).subscribe({
      next: (status) => {
        this.onboardingFlow.setStatus(status);

        if (status.onboardingConcluido) {
          this.onboardingFlow.clearDismissed(usuarioId);
          this.exibirAvisoOnboarding = false;
          return;
        }

        this.exibirAvisoOnboarding = true;
      },
      error: () => {
        this.exibirAvisoOnboarding = false;
      }
    });
  }

  private buildMobileNavGroups(items: NavItem[]): MobileNavGroup[] {
    const groups: MobileNavGroup[] = [];
    const groupMap: Record<string, (item: NavItem) => boolean> = {
      Principal: (item) => item.route === '/dashboards/dashboard1',
      'Gestão': (item) =>
        [
          '/page/pedido',
          '/page/funcionarios',
          '/page/cliente',
          '/page/usuarios/listar',
          '/page/perfil'
        ].some((route) => item.route?.startsWith(route)),
      'Cadastros / Configurações': (item) =>
        [
          '/cadastro-tecnico',
          '/page/empresa',
          '/config'
        ].some((route) => item.route?.startsWith(route)),
      Ajuda: (item) =>
        [
          '/page/suporte',
          '/page/ajuda'
        ].some((route) => item.route?.startsWith(route)),
    };

    Object.entries(groupMap).forEach(([title, matcher]) => {
      const groupItems = items.filter((item) => !item.navCap && matcher(item));
      if (groupItems.length) {
        groups.push({ title, items: groupItems });
      }
    });

    const usedRoutes = new Set(groups.flatMap((group) => group.items.map((item) => item.route || item.displayName || '')));
    const remainingItems = items.filter(
      (item) => !item.navCap && !usedRoutes.has(item.route || item.displayName || '')
    );

    if (remainingItems.length) {
      groups.push({ title: 'Mais', items: remainingItems });
    }

    return groups;
  }

  private getMobileItemKey(item: NavItem): string {
    return item.route || item.displayName || item.iconName || Math.random().toString();
  }

  private resolveCurrentPageTitle(url: string): string {
    const exactMatch = this.findNavLabel(url, true);
    if (exactMatch) return exactMatch;

    const prefixMatch = this.findNavLabel(url, false);
    if (prefixMatch) return prefixMatch;

    if (url.includes('/theme-pages/account-setting')) return 'Meu perfil';
    if (url.includes('/billing/')) return 'Assinatura';
    if (url.includes('/page/suporte')) return 'Suporte';

    return 'ClickManager';
  }

  private findNavLabel(url: string, exact: boolean): string | null {
    const search = (items: NavItem[]): string | null => {
      for (const item of items) {
        if (item.route) {
          const matched = exact ? this.router.isActive(item.route, true) : url.startsWith(item.route);
          if (matched) {
            return item.displayName || null;
          }
        }

        if (item.children?.length) {
          const childMatch = search(item.children);
          if (childMatch) return childMatch;
        }
      }

      return null;
    };

    return search(this.navItemsFiltrados);
  }

  private syncBodyScroll(): void {
    if (this.hasMobileOverlayOpen && this.isMobileLayout) {
      this.lockBodyScroll();
      return;
    }

    this.unlockBodyScroll();
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }
}
