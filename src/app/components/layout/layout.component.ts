import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { AuthService } from '../../core/services/auth.service';
import { ImportsModule } from '../shared/imports';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, MenuModule, ImportsModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  menuOpen = false;

  items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: 'Contas',
      icon: 'pi pi-credit-card',
      routerLink: '/contas',
    },
    {
      label: 'Transações',
      icon: 'pi pi-sort-alt',
      routerLink: '/transacoes',
    },
    {
      label: 'Categorias',
      icon: 'pi pi-th-large',
      routerLink: '/categorias',
    },
    {
      label: 'Relatórios',
      icon: 'pi pi-chart-bar',
      routerLink: '',
    },
    {
      label: 'Configurações',
      icon: 'pi pi-cog',
      routerLink: '',
    },
  ];

  async logout() {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  logoutItem: MenuItem = {
    label: 'Sair',
    icon: 'pi pi-sign-out',
    command: () => this.logout(),
  };
}
