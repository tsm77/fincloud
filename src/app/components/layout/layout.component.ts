/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/services/auth.service';

type MenuItem = {
  label: string;
  icon: string;
  link?: string;
  danger?: boolean;
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', link: '/dashboard' },
    { label: 'Contas', icon: 'pi pi-credit-card', link: '/contas' },
    { label: 'Transações', icon: 'pi pi-sort-alt', link: '/transacoes' },
    { label: 'Categorias', icon: 'pi pi-th-large', link: '/categorias' },
    { label: 'Relatórios', icon: 'pi pi-chart-bar', link: '/relatorios' },
    { label: 'Configurações', icon: 'pi pi-cog', link: '/configuracoes' },
  ];

  async logout() {
    this.auth.logout(); // você já tem removendo token
    await this.router.navigateByUrl('/login');
  }
}
