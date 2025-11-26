import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfilService } from '../../services/perfil.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Usuario } from 'src/app/models/usuario.model';
import { PerfilDialogComponent } from '../modal-perfil/perfil-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ImagemUtil } from 'src/app/utils/imagem-util';
import { TrocarPerfilDialogComponent } from '../modal-trocar-perfil/trocar-perfil-dialog.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';

interface Perfil {
  id?: number;
  nome: string;
  descricao?: string;
}

@Component({
  selector: 'app-gerenciar-perfil',
  templateUrl: './gerenciar-perfil.component.html',
  styleUrls: ['./gerenciar-perfil.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSidenavModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    TablerIconsModule,
    MatTableModule
  ]
})
export class GerenciarPerfilComponent implements OnInit {
  form!: FormGroup;
  perfis: Perfil[] = [];
  usuarios: Usuario[] = [];
  perfilSelecionado?: Perfil;
  editando = false;
  sidebarCollapsed = false;
  sidebarWidth = 300;
  displayedColumns1: string[] = ['usuario', 'perfil', 'acoes'];
  dataSource = new MatTableDataSource<Usuario>([]);
  imagemUtil = ImagemUtil;

  constructor(private fb: FormBuilder, private perfilService: PerfilService, private dialog: MatDialog, private toastrService: ToastrService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['']
    });

    this.carregarPerfis();
  }

  carregarPerfis(): void {
    this.perfilService.listar().subscribe(perfis => this.perfis = perfis);
  }

  listarUsuariosDoPerfil(perfil: Perfil): void {
    this.perfilSelecionado = perfil;
    this.editando = true;

    this.form.patchValue({
      nome: perfil.nome,
      descricao: perfil.descricao
    });

    this.perfilService.listarUsuariosDoPerfil(perfil.id!).subscribe(usuarios => {
      this.usuarios = usuarios;
    });
  }

  salvar(): void {
    // lógica de salvar
  }

  cancelar(): void {
    this.editando = false;
    this.form.reset();
    this.usuarios = [];
    this.perfilSelecionado = undefined;
  }

  editar(perfil: Perfil): void {
    this.openDialogPerfil('Edit', perfil);
  }

  excluir(id: number): void {
    this.perfilService.listarUsuariosDoPerfil(id).subscribe(usuarios => {
      if (usuarios.length > 0) {
        this.toastrService.warning('Não é possível excluir este perfil. Há usuários vinculados.');
        return;
      }
  
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Perfil',
          message: 'Deseja realmente excluir este perfil?',
          confirmText: 'Excluir',
          confirmColor: 'warn'
        },
        width: '400px'
      });
  
      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.perfilService.excluir(id).subscribe({
            next: () => {
              this.toastrService.success('Perfil excluído com sucesso.');
              this.carregarPerfis();
            },
            error: () => {
              this.toastrService.error('Erro ao excluir o perfil.');
            }
          });
        }
      });
    });
  }
  

  openDialogPerfil(action: 'Add' | 'Edit', perfil: any = {}): void {
    const dialogRef = this.dialog.open(PerfilDialogComponent, {
      data: { action, perfil },
      autoFocus: false,
      width: '600px'
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Save') {
        if (action === 'Add') {
          this.salvarPerfil(result.data);
        } else {
          this.atualizarPerfil(perfil.id, result.data);
        }
      }
    });
  }

  openDialogTrocarPerfil(usuario: Usuario): void {
    const dialogRef = this.dialog.open(TrocarPerfilDialogComponent, {
      data: {
        usuario,
        perfis: this.perfis
      },
      autoFocus: false,
      width: '600px'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.novoPerfilId) {
        this.perfilService.trocarPerfil(usuario.id!, result.novoPerfilId).subscribe({
          next: (usuarioAtualizado) => {
            this.toastrService.success(`Perfil do usuário ${usuarioAtualizado.nome} alterado com sucesso.`);
            this.carregarPerfis();
          },
          error: () => {
            this.toastrService.error(`Erro ao alterar o perfil do usuário ${usuario.nome}.`);
          }
        });
      }
    });
  }
  

  salvarPerfil(dados: Perfil): void {
    this.perfilService.salvar(dados).subscribe({
      next: () => {
        this.carregarPerfis();
      },
      error: () => {
        console.error('Erro ao salvar perfil');
      }
    });
  }
  
  atualizarPerfil(id: number, dados: Perfil): void {
    this.perfilService.atualizar(id, dados).subscribe({
      next: () => {
        this.toastrService.success('Perfil atualizado com sucesso');
        this.carregarPerfis();
      },
      error: () => {
        console.error('Erro ao atualizar perfil');
      }
    });
  }

  usarImagemPadrao(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/profile/user-1.jpg';
  }

}
