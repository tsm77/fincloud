import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ContasComponent } from './components/contas/contas.component';
import { TransacoesComponent } from './components/transacoes/transacoes.component';
import { CategoriasComponent } from './components/categorias/categorias.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'contas', component: ContasComponent },
      { path: 'transacoes', component: TransacoesComponent },
      { path: 'categorias', component: CategoriasComponent },
      // { path: 'relatorios', component: RelatoriosComponent },
      // { path: 'configuracoes', component: ConfiguracoesComponent },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
