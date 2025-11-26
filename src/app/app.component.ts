import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'Sistema de Gestão para gráficas ClickManager';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.carregarUsuarioCompleto().subscribe();
  }
}
