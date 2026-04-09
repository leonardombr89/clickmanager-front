import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';
import { DemoAnalyticsService } from './demo-analytics.service';
import { getDemoLandingUrl } from './demo-links';

@Component({
  selector: 'app-demo-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatButtonModule, MatIconModule],
  templateUrl: './demo-shell.component.html',
  styleUrl: './demo-shell.component.scss',
})
export class DemoShellComponent implements OnInit, OnDestroy {
  headerTitle = 'Teste o SmartCalc';
  headerEyebrow = 'Demo interativa';
  showBack = false;
  immersiveMode = false;
  mobileViewport = false;
  showExitConfirm = false;
  private sub = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly analytics: DemoAnalyticsService,
  ) {}

  ngOnInit(): void {
    this.updateViewport();
    this.syncHeader();
    this.sub.add(
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => this.syncHeader())
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.mobileViewport = window.innerWidth <= 900;
    this.syncHeader();
  }

  voltar(): void {
    const url = this.router.url;
    if (url.startsWith('/demo/whatsapp')) {
      this.router.navigate(['/demo/pedido']);
      return;
    }

    if (url.startsWith('/demo/pedido')) {
      this.router.navigate(['/demo/smartcalc']);
      return;
    }

    if (url.startsWith('/demo/smartcalc')) {
      this.showExitConfirm = true;
      return;
    }

    this.location.back();
  }

  cancelarSaida(): void {
    this.showExitConfirm = false;
  }

  confirmarSaida(): void {
    this.showExitConfirm = false;
    this.analytics.track('demo_exit_clicked', 'smartcalc', 'saida', {
      target: 'landing',
      fromUrl: this.router.url,
    });
    window.location.assign(getDemoLandingUrl());
  }

  abrirCadastro(): void {
    const page = this.router.url.startsWith('/demo/whatsapp')
      ? 'whatsapp'
      : this.router.url.startsWith('/demo/pedido')
        ? 'pedido'
        : 'smartcalc';

    this.analytics.track('demo_cta_signup_clicked', page, 'header', { cta: 'signup' });
    this.router.navigate(['/authentication/registro-gestor']);
  }

  private syncHeader(): void {
    const url = this.router.url;

    let current = this.route.firstChild;
    while (current?.firstChild) {
      current = current.firstChild;
    }

    const data = current?.snapshot.data ?? {};
    this.headerTitle = data['demoTitle'] ?? 'Teste o SmartCalc';
    this.headerEyebrow = data['demoEyebrow'] ?? 'Demo interativa';
    this.showBack = url !== '/demo';
    this.immersiveMode = url.startsWith('/demo/smartcalc') && !this.mobileViewport;
  }
}
