/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
import { ImportsModule } from '../shared/imports';
import { firstValueFrom } from 'rxjs';
import { TransacoesService } from '../../core/services/transacoes.service';

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  data: string | Date;
  categoriaNome: string;
}

interface ResumoCategoria {
  nome: string;
  valor: number;
  percentual: string;
  cor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ImportsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private service = inject(TransacoesService);

  // 🔢 RESUMO
  saldoTotal = 0;
  totalReceitas = 0;
  totalDespesas = 0;

  // 📋 LISTA
  ultimasTransacoes: Transacao[] = [];

  // 📊 GRÁFICO
  graficoCategorias: any;
  resumoCategorias: ResumoCategoria[] = [];

  // 📅 FILTRO (NOVO)
  dataInicial: Date | null = null;
  dataFinal: Date | null = null;

  chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  loading = false;

  async ngOnInit() {
    this.setMesAtual(); // padrão inicial
    await this.carregarDashboard();
  }

  // 🎯 DEFINE MÊS ATUAL COMO PADRÃO
  private setMesAtual() {
    const hoje = new Date();

    this.dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataFinal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  // 🚀 CARREGA DADOS
  async carregarDashboard() {
    this.loading = true;

    try {
      const lista = await firstValueFrom(this.service.listar());
      const transacoes: Transacao[] = lista ?? [];

      this.processarDados(transacoes);
    } catch (e) {
      console.error('Erro ao carregar dashboard', e);
    } finally {
      this.loading = false;
    }
  }

  // 🔄 QUANDO USUÁRIO FILTRA
  aplicarFiltro() {
    this.carregarDashboard();
  }

  // 🧠 PROCESSAMENTO CENTRAL
  private processarDados(transacoes: Transacao[]) {
    const filtradas = this.filtrarPorPeriodo(transacoes);

    this.calcularResumo(filtradas);
    this.montarUltimas(transacoes); // mantém geral
    this.montarGrafico(filtradas);
  }

  // 📅 FILTRO POR DATA
  private filtrarPorPeriodo(transacoes: Transacao[]) {
    if (!this.dataInicial || !this.dataFinal) return transacoes;

    const inicio = new Date(this.dataInicial);
    const fim = new Date(this.dataFinal);

    // garante inclusão do dia final completo
    fim.setHours(23, 59, 59, 999);

    return transacoes.filter((t) => {
      const data = new Date(t.data);
      return data >= inicio && data <= fim;
    });
  }

  // 💰 RESUMO
  private calcularResumo(transacoes: Transacao[]) {
    this.totalReceitas = transacoes
      .filter((t) => t.tipo === 'RECEITA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.totalDespesas = transacoes
      .filter((t) => t.tipo === 'DESPESA')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    this.saldoTotal = this.totalReceitas - this.totalDespesas;
  }

  // 📋 ÚLTIMAS TRANSAÇÕES
  private montarUltimas(transacoes: Transacao[]) {
    this.ultimasTransacoes = [...transacoes]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);
  }

  // 📊 GRÁFICO + RESUMO
  private montarGrafico(transacoes: Transacao[]) {
    const mapa: Record<string, number> = {};
    let total = 0;

    transacoes.forEach((t) => {
      if (t.tipo === 'DESPESA') {
        mapa[t.categoriaNome] = (mapa[t.categoriaNome] || 0) + Number(t.valor);

        total += Number(t.valor);
      }
    });

    const cores = [
      '#22c55e',
      '#ef4444',
      '#3b82f6',
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4',
    ];

    const categorias = Object.keys(mapa);

    this.resumoCategorias = categorias.map((nome, i) => {
      const valor = mapa[nome];

      return {
        nome,
        valor,
        percentual: total > 0 ? ((valor / total) * 100).toFixed(0) : '0',
        cor: cores[i % cores.length],
      };
    });

    this.graficoCategorias = {
      labels: categorias,
      datasets: [
        {
          data: Object.values(mapa),
          backgroundColor: this.resumoCategorias.map((c) => c.cor),
          borderWidth: 0,
        },
      ],
    };

    this.totalDespesas = total;
  }
}
