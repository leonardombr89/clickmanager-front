import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
    BrandingComponent
  ],
  templateUrl: './full.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit {

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

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  get isTablet(): boolean {
    return this.resView;
  }

  // for mobile app sidebar
  apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-connect.svg',
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
      });

    // Initialize project theme with options
    this.receiveOptions(this.options);

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
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
      });
  }

  ngOnDestroy() {
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
