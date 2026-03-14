import { Component } from '@angular/core';
import { ImportsModule } from '../shared/imports';

@Component({
  selector: 'app-transacoes',
  imports: [ImportsModule],
  templateUrl: './transacoes.component.html',
  styleUrl: './transacoes.component.scss',
})
export class TransacoesComponent {}
