import {
  Component,
  Output,
  EventEmitter,
  Input,
  signal,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { ImagemUtil } from 'src/app/utils/imagem-util';
import { CalculadoraConfigListResponse } from 'src/app/models/calculadora/calculadora-config-list-response.model';
import { CalculadoraConfigService } from 'src/app/pages/calculadora-config/calculadora-config.service';
import { SmartCalcComponent } from 'src/app/pages/apps/smart-calc/smart-calc.component';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
  color: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  isCollapse: boolean = false;
  showFiller = false;

  ImagemUtil = ImagemUtil;
  usuarioLogado: Usuario | null = null;

  options = this.settings.getOptions();

  calculadoraConfig!: CalculadoraConfigResponse;

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private authService: AuthService,
    private calculadoraService: CalculadoraConfigService
  ) { }

  ngOnInit() {
    this.authService.usuario$.subscribe(usuario => {
      this.usuarioLogado = usuario;
    });
    this.calculadoraService.getConfig().subscribe({
      next: (res) => this.calculadoraConfig = res,
      error: () => console.error('Erro ao buscar configurações')
    });
  }

  toggleCollpase() {
    this.isCollapse = !this.isCollapse;
  }

  logout(): void {
    this.authService.logout();
  }

  usarImagemPadrao(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
  }

  abrirSmartCalc(): void {
    this.dialog.open(SmartCalcComponent, {
      panelClass: 'smartcalc-dialog',
      width: '96vw',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false
    });

  }

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Zap Grafica',
      link: 'https://zapgrafica.com.br/home',
    }
  ];

  notifications: notifications[] = [
    {
      id: 1,
      img: '/assets/images/profile/user-1.jpg',
      title: 'Roman Joined the Team!',
      subtitle: 'Congratulate him sf',
    },
    {
      id: 2,
      img: '/assets/images/profile/user-2.jpg',
      title: 'New message received',
      subtitle: 'Salma sent you new message',
    },
    {
      id: 3,
      img: '/assets/images/profile/user-3.jpg',
      title: 'New Payment received',
      subtitle: 'Check your earnings',
    },
    {
      id: 4,
      img: '/assets/images/profile/user-4.jpg',
      title: 'Jolly completed tasks',
      subtitle: 'Assign her new tasks',
    },
    {
      id: 5,
      img: '/assets/images/profile/user-5.jpg',
      title: 'Hitesh Joined thed Team!',
      subtitle: 'Congratulate him',
    },
  ];
}

