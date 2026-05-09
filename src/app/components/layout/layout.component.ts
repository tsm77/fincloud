import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImportsModule } from '../shared/imports';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ImportsModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  menuOpen = false;
  readonly userName = this.usuarioService.nomeUsuario;
  readonly userInitials = computed(() => {
    const nome = this.userName().trim();
    const partes = nome.split(/\s+/).filter(Boolean);

    if (!partes.length || nome.toLowerCase() === 'usuario') {
      return 'U';
    }

    return partes
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  });

  items: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: '/dashboard',
    },
    {
      label: 'Contas',
      icon: 'pi pi-credit-card',
      route: '/contas',
    },
    {
      label: 'Transacoes',
      icon: 'pi pi-sort-alt',
      route: '/transacoes',
    },
    {
      label: 'Categorias',
      icon: 'pi pi-th-large',
      route: '/categorias',
    },
    {
      label: 'Relatorios',
      icon: 'pi pi-chart-bar',
      route: '/relatorios',
    },
    {
      label: 'Meu usuario',
      icon: 'pi pi-user-edit',
      route: '/usuarios',
    },
  ];

  async ngOnInit(): Promise<void> {
    try {
      await firstValueFrom(this.usuarioService.carregarAtual());
    } catch (error) {
      console.error('Erro ao carregar usuario logado', error);
    }
  }

  async abrirUsuario(): Promise<void> {
    this.menuOpen = false;
    await this.router.navigateByUrl('/usuarios');
  }

  async logout(): Promise<void> {
    this.auth.logout();
    this.usuarioService.limparAtual();
    await this.router.navigateByUrl('/login');
  }
}
