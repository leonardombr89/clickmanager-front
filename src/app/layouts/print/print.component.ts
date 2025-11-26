import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';

@Component({
  standalone: true,
  selector: 'app-print-layout',
  template: `<router-outlet></router-outlet>`,
  imports: [RouterOutlet, CommonModule, MaterialModule],
})
export class PrintComponent {}
