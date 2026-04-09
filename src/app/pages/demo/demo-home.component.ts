import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { getDemoLandingUrl } from './demo-links';
import { DemoSmartcalcService } from './demo-smartcalc.service';

@Component({
  selector: 'app-demo-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, SectionCardComponent, MobileTotalBarComponent],
  templateUrl: './demo-home.component.html',
  styleUrl: './demo-home.component.scss',
})
export class DemoHomeComponent implements OnInit {
  highlights = [
    '1 produto configurado',
    'A4 e A3 prontos para teste',
    'Acabamentos com impacto no cálculo',
    'Pedido e WhatsApp simulados',
  ];

  constructor(
    readonly router: Router,
    readonly demo: DemoSmartcalcService,
  ) {}

  ngOnInit(): void {
    this.demo.loadContext().subscribe({
      next: () => {},
      error: () => {},
    });
  }

  iniciar(): void {
    this.demo.reset();
    this.router.navigate(['/demo/smartcalc']);
  }

  verProduto(): void {
    window.location.assign(getDemoLandingUrl());
  }
}
